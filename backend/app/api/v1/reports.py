import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.encryption import decrypt, encrypt
from app.db.session import get_db
from app.models.admin_user import AdminUser
from app.models.audit_log import AuditAction, AuditLog
from app.models.report import Report, ReportCategory, ReportStatus, Severity, generate_tracking_id
from app.schemas.audit_log import AuditLogItem
from app.schemas.report import (
    ApiResponse,
    ReportCreate,
    ReportDetail,
    ReportListItem,
    ReportPublic,
    ReportSeverityUpdate,
    ReportStatusUpdate,
    ReportSubmitted,
)
from app.services.audit import log_action


def _get_client_ip(request: Request) -> str | None:
    """Extract the real client IP, respecting X-Forwarded-For behind proxies."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return None

router = APIRouter(prefix="/api/v1/reports", tags=["Reports"])


def _decrypt_report_detail(report: Report) -> dict:
    """Serialize a Report to dict with sensitive fields decrypted."""
    data = ReportDetail.model_validate(report).model_dump(mode="json")
    if data.get("description"):
        data["description"] = decrypt(data["description"])
    if data.get("resolution"):
        data["resolution"] = decrypt(data["resolution"])
    return data


# ── PUBLIC: Submit report (no auth) ──
@router.post("", response_model=ApiResponse)
async def submit_report(
    payload: ReportCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> ApiResponse:
    # Generate a unique tracking ID with retry on collision
    for _ in range(10):
        tid = generate_tracking_id()
        exists = await db.execute(
            select(Report.id).where(Report.tracking_id == tid)
        )
        if not exists.scalar_one_or_none():
            break
    else:
        raise HTTPException(
            status_code=503,
            detail="Unable to generate unique tracking ID.",
        )

    report = Report(
        tracking_id=tid,
        category=payload.category,
        severity=payload.severity,
        description=encrypt(payload.description),
        occurred_at=payload.occurred_at,
        location=payload.location,
    )
    db.add(report)
    await db.flush()

    await log_action(
        db, AuditAction.REPORT_CREATED, "report", str(report.id),
        metadata={"tracking_id": report.tracking_id, "category": payload.category.value},
        ip_address=_get_client_ip(request),
    )
    await db.commit()
    await db.refresh(report)

    return ApiResponse(
        data=ReportSubmitted(id=report.id, tracking_id=report.tracking_id).model_dump(mode="json"),
    )


# ── PUBLIC: Check status by tracking ID (no auth) ──
@router.get("/track/{tracking_id}", response_model=ApiResponse)
async def track_report(
    tracking_id: str,
    db: AsyncSession = Depends(get_db),
) -> ApiResponse:
    result = await db.execute(
        select(Report).where(
            Report.tracking_id == tracking_id,
            Report.is_deleted.is_(False),
        )
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    return ApiResponse(
        data=ReportPublic(
            tracking_id=report.tracking_id,
            status=report.status,
            created_at=report.created_at,
            updated_at=report.updated_at,
        ).model_dump(mode="json"),
    )


# ── ADMIN: List all reports (paginated, filterable) ──
@router.get("", response_model=ApiResponse)
async def list_reports(
    status: ReportStatus | None = None,
    category: ReportCategory | None = None,
    severity: Severity | None = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _user: AdminUser = Depends(get_current_user),
) -> ApiResponse:
    query = select(Report).where(Report.is_deleted.is_(False))

    if status:
        query = query.where(Report.status == status)
    if category:
        query = query.where(Report.category == category)
    if severity:
        query = query.where(Report.severity == severity)

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar() or 0

    # Paginate
    query = query.order_by(Report.created_at.desc())
    query = query.offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    reports = result.scalars().all()

    return ApiResponse(
        data=[ReportListItem.model_validate(r).model_dump(mode="json") for r in reports],
        meta={"total": total, "page": page, "limit": limit},
    )


# ── ADMIN: Get full report detail ──
@router.get("/{report_id}", response_model=ApiResponse)
async def get_report(
    report_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _user: AdminUser = Depends(get_current_user),
) -> ApiResponse:
    result = await db.execute(
        select(Report).where(Report.id == report_id, Report.is_deleted.is_(False))
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    return ApiResponse(data=_decrypt_report_detail(report))


# ── ADMIN: Update status ──
@router.patch("/{report_id}/status", response_model=ApiResponse)
async def update_status(
    report_id: uuid.UUID,
    payload: ReportStatusUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: AdminUser = Depends(get_current_user),
) -> ApiResponse:
    result = await db.execute(
        select(Report).where(Report.id == report_id, Report.is_deleted.is_(False))
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    old_status = report.status.value
    report.status = payload.status

    await log_action(
        db, AuditAction.REPORT_STATUS_UPDATED, "report", str(report_id),
        actor=user, metadata={"old": old_status, "new": payload.status.value},
        ip_address=_get_client_ip(request),
    )
    await db.commit()
    await db.refresh(report)

    return ApiResponse(data=_decrypt_report_detail(report))


# ── ADMIN: Update severity ──
@router.patch("/{report_id}/severity", response_model=ApiResponse)
async def update_severity(
    report_id: uuid.UUID,
    payload: ReportSeverityUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: AdminUser = Depends(get_current_user),
) -> ApiResponse:
    result = await db.execute(
        select(Report).where(Report.id == report_id, Report.is_deleted.is_(False))
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    old_severity = report.severity.value
    report.severity = payload.severity

    await log_action(
        db, AuditAction.REPORT_SEVERITY_UPDATED, "report", str(report_id),
        actor=user, metadata={"old": old_severity, "new": payload.severity.value},
        ip_address=_get_client_ip(request),
    )
    await db.commit()
    await db.refresh(report)

    return ApiResponse(data=_decrypt_report_detail(report))


# ── ADMIN: Soft delete ──
@router.delete("/{report_id}", response_model=ApiResponse)
async def delete_report(
    report_id: uuid.UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: AdminUser = Depends(get_current_user),
) -> ApiResponse:
    result = await db.execute(
        select(Report).where(Report.id == report_id, Report.is_deleted.is_(False))
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    report.is_deleted = True
    await log_action(
        db, AuditAction.REPORT_DELETED, "report", str(report_id), actor=user,
        ip_address=_get_client_ip(request),
    )
    await db.commit()

    return ApiResponse(data={"message": "Report deleted"})


# ── ADMIN: Case timeline (all audit entries for a report) ──
@router.get("/{report_id}/timeline", response_model=ApiResponse)
async def get_case_timeline(
    report_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _user: AdminUser = Depends(get_current_user),
) -> ApiResponse:
    """Return all audit log entries related to a report, ordered chronologically."""
    result = await db.execute(
        select(Report.id).where(Report.id == report_id, Report.is_deleted.is_(False))
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Report not found")

    rid = str(report_id)

    # Fetch logs where the resource is the report itself,
    # or where metadata references this report (notes, evidence).
    query = (
        select(AuditLog)
        .where(
            or_(
                (AuditLog.resource_type == "report") & (AuditLog.resource_id == rid),
                AuditLog.metadata_.op("->>")(  # type: ignore[union-attr]
                    "report_id"
                ) == rid,
            )
        )
        .order_by(AuditLog.created_at.asc())
    )
    logs = (await db.execute(query)).scalars().all()

    return ApiResponse(
        data=[
            AuditLogItem.model_validate(log).model_dump(mode="json")
            for log in logs
        ],
    )
