import csv
import io
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from fpdf import FPDF
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_role
from app.api.v1.ws import WSEvent
from app.api.v1.ws import manager as ws_manager
from app.core.config import settings
from app.core.encryption import decrypt, encrypt
from app.core.rate_limit import (
    RATE_ERASURE,
    RATE_REPORT_SUBMIT,
    RATE_REPORT_TRACK,
    limiter,
)
from app.db.session import get_db
from app.models.admin_user import AdminRole, AdminUser
from app.models.audit_log import AuditAction, AuditLog
from app.models.report import (
    Report,
    ReportCategory,
    ReportStatus,
    Severity,
    generate_tracking_id,
)
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
from app.services.erasure import erase_report
from app.services.retention import purge_expired_reports


def _get_client_ip(request: Request) -> str | None:
    """Extract the real client IP, respecting X-Forwarded-For behind proxies."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return None


def _get_user_agent(request: Request) -> str | None:
    return request.headers.get("user-agent")

router = APIRouter(prefix="/api/v1/reports", tags=["Reports"])


def _snapshot_report(report: Report) -> dict:
    """Capture report state for audit metadata (no PII)."""
    return {
        "status": report.status.value,
        "severity": report.severity.value,
        "category": report.category.value,
        "resolution_type": report.resolution_type.value if report.resolution_type else None,
        "assigned_to": str(report.assigned_to) if report.assigned_to else None,
        "is_deleted": report.is_deleted,
    }


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
@limiter.limit(RATE_REPORT_SUBMIT)
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

    now = datetime.now(timezone.utc)
    report = Report(
        tracking_id=tid,
        category=payload.category,
        severity=payload.severity,
        description=encrypt(payload.description),
        occurred_at=payload.occurred_at,
        location=payload.location,
        acknowledgment_due=now + timedelta(days=settings.ACKNOWLEDGMENT_DAYS),
        feedback_due=now + timedelta(days=settings.FEEDBACK_DEADLINE_DAYS),
        status_history=[{"status": "OPEN", "at": now.isoformat()}],
    )
    db.add(report)
    await db.flush()

    await log_action(
        db, AuditAction.REPORT_CREATED, "report", str(report.id),
        metadata={"tracking_id": report.tracking_id, "category": payload.category.value},
        ip_address=_get_client_ip(request),
        user_agent=_get_user_agent(request),
    )
    await db.commit()
    await db.refresh(report)

    await ws_manager.broadcast(WSEvent.NEW_REPORT, {
        "tracking_id": report.tracking_id,
        "category": payload.category.value,
        "severity": payload.severity.value,
    })

    return ApiResponse(
        data=ReportSubmitted(id=report.id, tracking_id=report.tracking_id).model_dump(mode="json"),
    )


# ── PUBLIC: Check status by tracking ID (no auth) ──
@router.get("/track/{tracking_id}", response_model=ApiResponse)
@limiter.limit(RATE_REPORT_TRACK)
async def track_report(
    tracking_id: str,
    request: Request,
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
            resolution_type=report.resolution_type,
            created_at=report.created_at,
            updated_at=report.updated_at,
            acknowledgment_due=report.acknowledgment_due,
            feedback_due=report.feedback_due,
            feedback_given_at=report.feedback_given_at,
            status_history=report.status_history or [],
        ).model_dump(mode="json"),
    )


# ── PUBLIC: GDPR Art. 17 — Right to erasure (no auth) ──
@router.delete("/track/{tracking_id}/erasure", response_model=ApiResponse)
@limiter.limit(RATE_ERASURE)
async def request_erasure(
    tracking_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> ApiResponse:
    """Reporter-initiated permanent data deletion (GDPR Art. 17).

    Tracking ID is the proof of ownership — whoever holds it can erase.
    Deletes: report, evidence (GCS + DB), case notes.
    Preserves: audit log with tracking_id only.
    """
    erased = await erase_report(
        db,
        tracking_id=tracking_id,
        ip_address=_get_client_ip(request),
        user_agent=_get_user_agent(request),
    )
    if not erased:
        raise HTTPException(status_code=404, detail="Report not found")

    return ApiResponse(data={"message": "Your data has been permanently erased."})


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

    items = []
    for r in reports:
        item = ReportListItem.model_validate(r).model_dump(mode="json")
        if item.get("description"):
            item["description"] = decrypt(item["description"])
        items.append(item)

    return ApiResponse(
        data=items,
        meta={"total": total, "page": page, "limit": limit},
    )


# ── ADMIN: Get full report detail ──
@router.get("/{report_id}", response_model=ApiResponse)
async def get_report(
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

    # Serialize BEFORE commit — async sessions expire objects on commit
    data = _decrypt_report_detail(report)

    # Log access — track who viewed which report
    await log_action(
        db,
        AuditAction.REPORT_VIEWED,
        "report",
        str(report_id),
        actor=user,
        metadata={"tracking_id": report.tracking_id},
        ip_address=_get_client_ip(request),
        user_agent=_get_user_agent(request),
    )
    await db.commit()

    return ApiResponse(data=data)


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

    before = _snapshot_report(report)
    old_status = report.status.value
    report.status = payload.status

    # Set resolution_type when closing (or clear when reopening)
    if payload.status == ReportStatus.CLOSED:
        if payload.resolution_type is not None:
            report.resolution_type = payload.resolution_type
    else:
        report.resolution_type = None

    # Append to status_history
    history = list(report.status_history or [])
    history.append({"status": payload.status.value, "at": datetime.now(timezone.utc).isoformat()})
    report.status_history = history

    # Record feedback timestamp when case reaches CLOSED
    if payload.status == ReportStatus.CLOSED and not report.feedback_given_at:
        report.feedback_given_at = datetime.now(timezone.utc)

    after = _snapshot_report(report)
    meta = {
        "old": old_status,
        "new": payload.status.value,
        "before": before,
        "after": after,
    }
    if payload.resolution_type:
        meta["resolution_type"] = payload.resolution_type.value
    await log_action(
        db, AuditAction.REPORT_STATUS_UPDATED, "report", str(report_id),
        actor=user,
        metadata=meta,
        ip_address=_get_client_ip(request),
        user_agent=_get_user_agent(request),
    )
    await db.commit()
    await db.refresh(report)

    await ws_manager.broadcast(WSEvent.STATUS_CHANGED, {
        "tracking_id": report.tracking_id,
        "old": old_status,
        "new": payload.status.value,
    })

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

    before = _snapshot_report(report)
    old_severity = report.severity.value
    report.severity = payload.severity
    after = _snapshot_report(report)

    await log_action(
        db, AuditAction.REPORT_SEVERITY_UPDATED, "report", str(report_id),
        actor=user,
        metadata={
            "old": old_severity, "new": payload.severity.value,
            "before": before, "after": after,
        },
        ip_address=_get_client_ip(request),
        user_agent=_get_user_agent(request),
    )
    await db.commit()
    await db.refresh(report)

    await ws_manager.broadcast(WSEvent.SEVERITY_CHANGED, {
        "tracking_id": report.tracking_id,
        "old": old_severity,
        "new": payload.severity.value,
    })

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

    before = _snapshot_report(report)
    report.is_deleted = True
    after = _snapshot_report(report)
    await log_action(
        db, AuditAction.REPORT_DELETED, "report", str(report_id), actor=user,
        metadata={"before": before, "after": after},
        ip_address=_get_client_ip(request),
        user_agent=_get_user_agent(request),
    )
    await db.commit()

    await ws_manager.broadcast(WSEvent.REPORT_DELETED, {
        "tracking_id": report.tracking_id,
    })

    return ApiResponse(data={"message": "Report deleted"})


# ── Export helpers ──

_CSV_COLUMNS = [
    "Tracking ID", "Category", "Severity", "Status",
    "Location", "Occurred At", "Created At",
    "Ack Due", "Feedback Due", "Evidence", "Notes",
]


def _build_filtered_query(
    status: ReportStatus | None,
    category: ReportCategory | None,
    severity: Severity | None,
):
    """Build a filtered report query (shared by list + export)."""
    query = select(Report).where(Report.is_deleted.is_(False))
    if status:
        query = query.where(Report.status == status)
    if category:
        query = query.where(Report.category == category)
    if severity:
        query = query.where(Report.severity == severity)
    return query.order_by(Report.created_at.desc())


def _fmt_dt(val: datetime | None) -> str:
    if val is None:
        return ""
    return val.strftime("%Y-%m-%d %H:%M")


def _report_to_row(r: Report) -> list:
    return [
        r.tracking_id,
        r.category.value,
        r.severity.value,
        r.status.value,
        r.location or "",
        r.occurred_at.isoformat() if r.occurred_at else "",
        _fmt_dt(r.created_at),
        _fmt_dt(r.acknowledgment_due),
        _fmt_dt(r.feedback_due),
        r.evidence_count,
        r.notes_count,
    ]


def _export_filters_meta(
    status: ReportStatus | None,
    category: ReportCategory | None,
    severity: Severity | None,
) -> dict:
    meta: dict = {}
    if status:
        meta["status"] = status.value
    if category:
        meta["category"] = category.value
    if severity:
        meta["severity"] = severity.value
    return meta


def _generate_pdf(reports: list[Report], filters: dict) -> bytes:
    """Build a branded compliance PDF table."""
    pdf = FPDF(orientation="L", unit="mm", format="A4")
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()

    # ── Header bar ──
    pdf.set_fill_color(0, 101, 62)  # #00653E
    pdf.rect(0, 0, 297, 22, "F")
    pdf.set_font("Helvetica", "B", 14)
    pdf.set_text_color(255, 255, 255)
    pdf.set_xy(10, 5)
    pdf.cell(0, 10, "Sawt Safe - Compliance Report")
    pdf.ln()
    pdf.set_font("Helvetica", "", 8)
    pdf.set_xy(10, 13)
    now_str = datetime.now(timezone.utc).strftime(
        "%Y-%m-%d %H:%M UTC"
    )
    filter_str = ", ".join(
        f"{k}: {v}" for k, v in filters.items()
    ) or "All reports"
    pdf.cell(
        0, 5,
        f"Generated: {now_str}  |  Filters: {filter_str}"
        f"  |  Total: {len(reports)}",
    )

    pdf.set_y(28)

    # ── Table header ──
    col_widths = [28, 30, 22, 28, 40, 26, 36, 36, 36, 16, 16]
    pdf.set_font("Helvetica", "B", 7)
    pdf.set_fill_color(235, 235, 235)
    pdf.set_text_color(0, 0, 0)
    for i, col in enumerate(_CSV_COLUMNS):
        pdf.cell(col_widths[i], 7, col, border=1, fill=True)
    pdf.ln()

    # ── Table rows ──
    pdf.set_font("Helvetica", "", 7)
    for r in reports:
        row = _report_to_row(r)
        for i, val in enumerate(row):
            pdf.cell(
                col_widths[i], 6,
                str(val)[:40], border=1,
            )
        pdf.ln()

    # ── Footer ──
    pdf.set_y(-12)
    pdf.set_font("Helvetica", "I", 6)
    pdf.set_text_color(150, 150, 150)
    pdf.cell(
        0, 5,
        "Confidential - Sawt Safe Compliance Export",
        align="C",
    )

    return bytes(pdf.output())


# ── ADMIN: Export CSV ──
@router.get("/export/csv")
async def export_csv(
    request: Request,
    status: ReportStatus | None = None,
    category: ReportCategory | None = None,
    severity: Severity | None = None,
    page: int | None = Query(None, ge=1),
    limit: int | None = Query(None, ge=1, le=10000),
    db: AsyncSession = Depends(get_db),
    user: AdminUser = Depends(get_current_user),
) -> StreamingResponse:
    """Export filtered reports as CSV download."""
    query = _build_filtered_query(status, category, severity)
    if page is not None and limit is not None:
        query = query.offset((page - 1) * limit).limit(limit)
    elif limit is not None:
        query = query.limit(limit)

    result = await db.execute(query)
    rows = result.scalars().all()

    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(_CSV_COLUMNS)
    for r in rows:
        writer.writerow(_report_to_row(r))

    filters = _export_filters_meta(status, category, severity)
    await log_action(
        db, AuditAction.REPORT_EXPORTED, "report", "bulk",
        actor=user,
        metadata={"format": "csv", "count": len(rows), **filters},
        ip_address=_get_client_ip(request),
        user_agent=_get_user_agent(request),
    )
    await db.commit()

    stamp = datetime.now(timezone.utc).strftime("%Y%m%d")
    fname = f"sawtsafe-reports-{stamp}.csv"
    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{fname}"',
        },
    )


# ── ADMIN: Export PDF ──
@router.get("/export/pdf")
async def export_pdf(
    request: Request,
    status: ReportStatus | None = None,
    category: ReportCategory | None = None,
    severity: Severity | None = None,
    page: int | None = Query(None, ge=1),
    limit: int | None = Query(None, ge=1, le=10000),
    db: AsyncSession = Depends(get_db),
    user: AdminUser = Depends(get_current_user),
) -> StreamingResponse:
    """Export filtered reports as branded PDF download."""
    query = _build_filtered_query(status, category, severity)
    if page is not None and limit is not None:
        query = query.offset((page - 1) * limit).limit(limit)
    elif limit is not None:
        query = query.limit(limit)

    result = await db.execute(query)
    rows = result.scalars().all()

    filters = _export_filters_meta(status, category, severity)
    pdf_bytes = _generate_pdf(rows, filters)

    await log_action(
        db, AuditAction.REPORT_EXPORTED, "report", "bulk",
        actor=user,
        metadata={"format": "pdf", "count": len(rows), **filters},
        ip_address=_get_client_ip(request),
        user_agent=_get_user_agent(request),
    )
    await db.commit()

    stamp = datetime.now(timezone.utc).strftime("%Y%m%d")
    fname = f"sawtsafe-reports-{stamp}.pdf"
    return StreamingResponse(
        iter([pdf_bytes]),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{fname}"',
        },
    )


# ── ADMIN: Compliance deadline stats ──
@router.get("/compliance/stats", response_model=ApiResponse)
async def compliance_stats(
    db: AsyncSession = Depends(get_db),
    _user: AdminUser = Depends(get_current_user),
) -> ApiResponse:
    """Return counts of overdue acknowledgments and feedback deadlines."""
    now = datetime.now(timezone.utc)
    warn_threshold = now + timedelta(days=settings.FEEDBACK_WARNING_DAYS)

    # Acknowledgment overdue: ack_due < now
    ack_overdue = (await db.execute(
        select(func.count()).select_from(
            select(Report).where(
                Report.is_deleted.is_(False),
                Report.acknowledgment_due < now,
                Report.status == ReportStatus.OPEN,
            ).subquery()
        )
    )).scalar() or 0

    # Feedback overdue: feedback_due < now AND not closed
    fb_overdue = (await db.execute(
        select(func.count()).select_from(
            select(Report).where(
                Report.is_deleted.is_(False),
                Report.status != ReportStatus.CLOSED,
                Report.feedback_due < now,
            ).subquery()
        )
    )).scalar() or 0

    # Feedback approaching: feedback_due between now and warn_threshold
    fb_warning = (await db.execute(
        select(func.count()).select_from(
            select(Report).where(
                Report.is_deleted.is_(False),
                Report.status != ReportStatus.CLOSED,
                Report.feedback_due >= now,
                Report.feedback_due <= warn_threshold,
            ).subquery()
        )
    )).scalar() or 0

    return ApiResponse(data={
        "acknowledgment_overdue": ack_overdue,
        "feedback_overdue": fb_overdue,
        "feedback_warning": fb_warning,
    })


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


# ── ADMIN: Access log — who viewed this report ──
@router.get("/{report_id}/access-log", response_model=ApiResponse)
async def get_access_log(
    report_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _user: AdminUser = Depends(get_current_user),
) -> ApiResponse:
    """Return all REPORT_VIEWED audit entries for a specific report."""
    result = await db.execute(
        select(Report.id).where(
            Report.id == report_id,
            Report.is_deleted.is_(False),
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Report not found")

    query = (
        select(AuditLog)
        .where(
            AuditLog.resource_type == "report",
            AuditLog.resource_id == str(report_id),
            AuditLog.action == AuditAction.REPORT_VIEWED,
        )
        .order_by(AuditLog.created_at.desc())
    )
    logs = (await db.execute(query)).scalars().all()

    return ApiResponse(
        data=[
            AuditLogItem.model_validate(log).model_dump(mode="json")
            for log in logs
        ],
    )


# ── ADMIN: Data retention purge (ADMIN role only) ──
@router.post("/retention/purge", response_model=ApiResponse)
async def retention_purge(
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: AdminUser = Depends(require_role(AdminRole.ADMIN)),
) -> ApiResponse:
    """Hard-delete closed reports past the retention period.

    Only ADMIN role can trigger this. Evidence files are removed
    from GCS, and all related notes/evidence DB rows are deleted.
    Audit logs are preserved forever.
    """
    purged = await purge_expired_reports(
        db,
        actor=user,
        ip_address=_get_client_ip(request),
        user_agent=_get_user_agent(request),
    )
    return ApiResponse(
        data={
            "purged_count": purged,
            "retention_days": settings.RETENTION_DAYS,
        },
    )
