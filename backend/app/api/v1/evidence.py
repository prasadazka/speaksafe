import uuid

import structlog
from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile
from fastapi.responses import StreamingResponse
from google.cloud import storage as gcs
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_client_ip, get_current_user, get_user_agent
from app.api.v1.ws import WSEvent
from app.api.v1.ws import manager as ws_manager
from app.core.config import settings
from app.core.encryption import decrypt_bytes, encrypt_bytes
from app.core.rate_limit import RATE_EVIDENCE_UPLOAD, limiter
from app.db.session import get_db
from app.models.admin_user import AdminUser
from app.models.audit_log import AuditAction
from app.models.evidence import Evidence
from app.models.report import Report
from app.schemas.evidence import EvidenceItem
from app.schemas.report import ApiResponse
from app.services.audit import log_action

router = APIRouter(prefix="/api/v1/reports/{report_id}/evidence", tags=["Evidence"])

ALLOWED_TYPES = {
    "image/png",
    "image/jpeg",
    "image/gif",
    "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
    "video/mp4",
    "audio/mpeg",
}
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100 MB


def _gcs_client() -> gcs.Client:
    return gcs.Client()


def _bucket() -> gcs.Bucket:
    return _gcs_client().bucket(settings.GCS_BUCKET)


async def _get_report(report_id: uuid.UUID, db: AsyncSession) -> Report:
    result = await db.execute(
        select(Report).where(Report.id == report_id, Report.is_deleted.is_(False))
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


# ── PUBLIC: Reporter uploads evidence ──
@router.post("", response_model=ApiResponse)
@limiter.limit(RATE_EVIDENCE_UPLOAD)
async def upload_evidence(
    report_id: uuid.UUID,
    file: UploadFile,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> ApiResponse:
    report = await _get_report(report_id, db)

    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail=f"File type {file.content_type} not allowed")

    content = await file.read()
    size = len(content)
    if size > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File exceeds 100 MB limit")

    # Encrypt file content before uploading to GCS
    encrypted_content, nonce_b64 = encrypt_bytes(content)

    file_id = uuid.uuid4()
    file_key = f"evidence/{report_id}/{file_id}/{file.filename}"
    blob = _bucket().blob(file_key)
    blob.upload_from_string(
        encrypted_content, content_type="application/octet-stream",
    )

    evidence = Evidence(
        report_id=report_id,
        file_name=file.filename or "unnamed",
        file_key=file_key,
        mime_type=file.content_type or "application/octet-stream",
        size_bytes=size,
        encryption_iv=nonce_b64,
        uploaded_by="reporter",
    )
    db.add(evidence)
    report.evidence_count += 1
    await db.flush()

    await log_action(
        db, AuditAction.EVIDENCE_UPLOADED, "evidence", str(evidence.id),
        metadata={"report_id": str(report_id), "file_name": evidence.file_name, "size": size},
        ip_address=None,
        user_agent=None,
    )
    await db.commit()
    await db.refresh(evidence)

    await ws_manager.broadcast(WSEvent.EVIDENCE_UPLOADED, {
        "report_id": str(report_id),
        "tracking_id": report.tracking_id,
        "file_name": evidence.file_name,
    })

    return ApiResponse(
        data=EvidenceItem.from_evidence(evidence).model_dump(mode="json"),
    )


# ── ADMIN: List evidence for a report ──
@router.get("", response_model=ApiResponse)
async def list_evidence(
    report_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _user: AdminUser = Depends(get_current_user),
) -> ApiResponse:
    await _get_report(report_id, db)

    result = await db.execute(
        select(Evidence).where(
            Evidence.report_id == report_id,
            Evidence.is_deleted.is_(False),
        ).order_by(Evidence.created_at.desc())
    )
    items = result.scalars().all()

    return ApiResponse(
        data=[EvidenceItem.from_evidence(e).model_dump(mode="json") for e in items],
    )


# ── ADMIN: Download evidence file ──
@router.get("/{evidence_id}", response_model=None)
async def download_evidence(
    report_id: uuid.UUID,
    evidence_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _user: AdminUser = Depends(get_current_user),
) -> StreamingResponse:
    await _get_report(report_id, db)

    result = await db.execute(
        select(Evidence).where(
            Evidence.id == evidence_id,
            Evidence.report_id == report_id,
            Evidence.is_deleted.is_(False),
        )
    )
    evidence = result.scalar_one_or_none()
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")

    blob = _bucket().blob(evidence.file_key)
    if not blob.exists():
        raise HTTPException(status_code=404, detail="File not found in storage")

    raw = blob.download_as_bytes()

    # Decrypt if the file was encrypted (has encryption_iv)
    if evidence.encryption_iv:
        try:
            content = decrypt_bytes(raw, evidence.encryption_iv)
        except Exception:
            structlog.get_logger().error(
                "evidence_decryption_failed",
                evidence_id=str(evidence_id),
                report_id=str(report_id),
            )
            raise HTTPException(
                status_code=422,
                detail="Evidence file is corrupted or cannot be decrypted",
            )
    else:
        content = raw  # legacy unencrypted files

    return StreamingResponse(
        iter([content]),
        media_type=evidence.mime_type,
        headers={"Content-Disposition": f'attachment; filename="{evidence.file_name}"'},
    )


# ── ADMIN: Soft delete evidence ──
@router.delete("/{evidence_id}", response_model=ApiResponse)
async def delete_evidence(
    report_id: uuid.UUID,
    evidence_id: uuid.UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: AdminUser = Depends(get_current_user),
) -> ApiResponse:
    report = await _get_report(report_id, db)

    result = await db.execute(
        select(Evidence).where(
            Evidence.id == evidence_id,
            Evidence.report_id == report_id,
            Evidence.is_deleted.is_(False),
        )
    )
    evidence = result.scalar_one_or_none()
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")

    evidence.is_deleted = True
    report.evidence_count = max(0, report.evidence_count - 1)
    await log_action(
        db, AuditAction.EVIDENCE_DELETED, "evidence", str(evidence_id),
        actor=user, metadata={"report_id": str(report_id), "file_name": evidence.file_name},
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )
    await db.commit()

    return ApiResponse(data={"message": "Evidence deleted"})
