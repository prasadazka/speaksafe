import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.admin_user import AdminUser
from app.models.audit_log import AuditAction
from app.models.report import Report, ReportCategory, ReportStatus, Severity, generate_tracking_id
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

router = APIRouter(prefix="/api/v1/reports", tags=["Reports"])


# ── PUBLIC: Submit report (no auth) ──
@router.post("", response_model=ApiResponse)
async def submit_report(
    payload: ReportCreate,
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
        raise HTTPException(status_code=503, detail="Unable to generate unique tracking ID. Please retry.")

    report = Report(
        tracking_id=tid,
        category=payload.category,
        severity=payload.severity,
        description=payload.description,
        occurred_at=payload.occurred_at,
        location=payload.location,
    )
    db.add(report)
    await db.flush()

    await log_action(
        db, AuditAction.REPORT_CREATED, "report", str(report.id),
        metadata={"tracking_id": report.tracking_id, "category": payload.category.value},
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

    return ApiResponse(
        data=ReportDetail.model_validate(report).model_dump(mode="json"),
    )


# ── ADMIN: Update status ──
@router.patch("/{report_id}/status", response_model=ApiResponse)
async def update_status(
    report_id: uuid.UUID,
    payload: ReportStatusUpdate,
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
    )
    await db.commit()
    await db.refresh(report)

    return ApiResponse(
        data=ReportDetail.model_validate(report).model_dump(mode="json"),
    )


# ── ADMIN: Update severity ──
@router.patch("/{report_id}/severity", response_model=ApiResponse)
async def update_severity(
    report_id: uuid.UUID,
    payload: ReportSeverityUpdate,
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
    )
    await db.commit()
    await db.refresh(report)

    return ApiResponse(
        data=ReportDetail.model_validate(report).model_dump(mode="json"),
    )


# ── ADMIN: Soft delete ──
@router.delete("/{report_id}", response_model=ApiResponse)
async def delete_report(
    report_id: uuid.UUID,
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
    )
    await db.commit()

    return ApiResponse(data={"message": "Report deleted"})
