"""GDPR Art. 17 — Right to erasure ("right to be forgotten").

Reporter-initiated hard-delete of their report and all associated data.
The tracking ID is the only proof of ownership — whoever holds it can erase.
Audit logs are NEVER deleted; only the tracking_id is recorded.
"""

from google.cloud import storage as gcs
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.audit_log import AuditAction
from app.models.case_note import CaseNote
from app.models.evidence import Evidence
from app.models.report import Report
from app.services.audit import log_action


def _gcs_bucket() -> gcs.Bucket:
    return gcs.Client().bucket(settings.GCS_BUCKET)


async def erase_report(
    db: AsyncSession,
    tracking_id: str,
    ip_address: str | None = None,
    user_agent: str | None = None,
) -> bool:
    """Permanently erase a report by tracking ID (reporter-initiated).

    Deletes: evidence files (GCS + DB), case notes, report row.
    Preserves: audit log entry with tracking_id only (no PII).

    Returns True if a report was found and erased, False if not found.
    """
    result = await db.execute(
        select(Report).where(Report.tracking_id == tracking_id)
    )
    report = result.scalar_one_or_none()
    if not report:
        return False

    rid = report.id

    # 1. Delete evidence files from GCS
    evidence_rows = (await db.execute(
        select(Evidence).where(Evidence.report_id == rid)
    )).scalars().all()

    bucket = None
    for ev in evidence_rows:
        try:
            if bucket is None:
                bucket = _gcs_bucket()
            blob = bucket.blob(ev.file_key)
            blob.delete()
        except Exception:
            pass  # best-effort GCS cleanup

    # 2. Hard-delete evidence rows
    await db.execute(
        delete(Evidence).where(Evidence.report_id == rid)
    )

    # 3. Hard-delete case notes
    await db.execute(
        delete(CaseNote).where(CaseNote.report_id == rid)
    )

    # 4. Log erasure BEFORE deleting report (no PII in metadata)
    await log_action(
        db,
        AuditAction.REPORT_ERASED,
        "report",
        str(rid),
        metadata={
            "tracking_id": tracking_id,
            "reason": "GDPR Art. 17 — reporter-initiated erasure",
            "evidence_files_deleted": len(evidence_rows),
        },
        ip_address=ip_address,
        user_agent=user_agent,
    )

    # 5. Hard-delete the report
    await db.delete(report)
    await db.commit()

    return True
