import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from google.cloud import storage as gcs
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.config import settings
from app.db.session import get_db
from app.models.admin_user import AdminUser
from app.models.evidence import Evidence
from app.models.report import Report
from app.schemas.evidence import EvidenceItem
from app.schemas.report import ApiResponse

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
async def upload_evidence(
    report_id: uuid.UUID,
    file: UploadFile,
    db: AsyncSession = Depends(get_db),
) -> ApiResponse:
    report = await _get_report(report_id, db)

    # Validate file type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail=f"File type {file.content_type} not allowed")

    # Read file content
    content = await file.read()
    size = len(content)
    if size > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File exceeds 100 MB limit")

    # Upload to GCS
    file_id = uuid.uuid4()
    file_key = f"evidence/{report_id}/{file_id}/{file.filename}"
    blob = _bucket().blob(file_key)
    blob.upload_from_string(content, content_type=file.content_type)

    # Save metadata to DB
    evidence = Evidence(
        report_id=report_id,
        file_name=file.filename or "unnamed",
        file_key=file_key,
        mime_type=file.content_type or "application/octet-stream",
        size_bytes=size,
        uploaded_by="reporter",
    )
    db.add(evidence)
    report.evidence_count += 1
    await db.commit()
    await db.refresh(evidence)

    return ApiResponse(
        data=EvidenceItem.model_validate(evidence).model_dump(mode="json"),
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
        data=[EvidenceItem.model_validate(e).model_dump(mode="json") for e in items],
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

    content = blob.download_as_bytes()
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
    db: AsyncSession = Depends(get_db),
    _user: AdminUser = Depends(get_current_user),
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
    await db.commit()

    return ApiResponse(data={"message": "Evidence deleted"})
