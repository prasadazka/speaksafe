"""Data retention & auto-purge service (GDPR Art. 5(1)(e)).

Hard-deletes closed reports whose retention period has expired,
along with their evidence files (GCS + DB) and case notes.
Audit logs are NEVER deleted — they are the compliance record.
"""

from datetime import datetime, timedelta, timezone

from google.cloud import storage as gcs
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.admin_user import AdminUser
from app.models.audit_log import AuditAction
from app.models.case_note import CaseNote
from app.models.evidence import Evidence
from app.models.report import Report, ReportStatus
from app.services.audit import log_action


def _gcs_bucket() -> gcs.Bucket:
    return gcs.Client().bucket(settings.GCS_BUCKET)


async def purge_expired_reports(
    db: AsyncSession,
    actor: AdminUser | None = None,
    ip_address: str | None = None,
    user_agent: str | None = None,
) -> int:
    """Find and hard-delete reports past retention period.

    Criteria: status == CLOSED AND feedback_given_at + RETENTION_DAYS < now.

    Returns the number of reports purged.
    """
    cutoff = datetime.now(timezone.utc) - timedelta(days=settings.RETENTION_DAYS)

    # Find expired closed reports
    result = await db.execute(
        select(Report).where(
            Report.status == ReportStatus.CLOSED,
            Report.feedback_given_at.is_not(None),
            Report.feedback_given_at < cutoff,
        )
    )
    expired_reports = result.scalars().all()

    if not expired_reports:
        return 0

    purged = 0
    bucket = None

    for report in expired_reports:
        rid = report.id

        # 1. Delete evidence files from GCS
        evidence_rows = (await db.execute(
            select(Evidence).where(Evidence.report_id == rid)
        )).scalars().all()

        for ev in evidence_rows:
            try:
                if bucket is None:
                    bucket = _gcs_bucket()
                blob = bucket.blob(ev.file_key)
                blob.delete()
            except Exception:
                pass  # GCS delete is best-effort; DB record still removed

        # 2. Hard-delete evidence rows
        await db.execute(
            delete(Evidence).where(Evidence.report_id == rid)
        )

        # 3. Hard-delete case notes
        await db.execute(
            delete(CaseNote).where(CaseNote.report_id == rid)
        )

        # 4. Log purge action BEFORE deleting the report
        await log_action(
            db,
            AuditAction.REPORT_PURGED,
            "report",
            str(rid),
            actor=actor,
            metadata={
                "tracking_id": report.tracking_id,
                "closed_at": report.feedback_given_at.isoformat()
                if report.feedback_given_at
                else None,
                "retention_days": settings.RETENTION_DAYS,
                "evidence_files_deleted": len(evidence_rows),
            },
            ip_address=ip_address,
            user_agent=user_agent,
        )

        # 5. Hard-delete the report itself
        await db.delete(report)
        purged += 1

    await db.commit()
    return purged
