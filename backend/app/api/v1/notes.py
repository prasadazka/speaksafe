import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.encryption import decrypt, encrypt
from app.db.session import get_db
from app.models.admin_user import AdminUser
from app.models.audit_log import AuditAction
from app.models.case_note import CaseNote
from app.models.report import Report
from app.schemas.case_note import NoteCreate, NoteItem
from app.schemas.report import ApiResponse
from app.services.audit import log_action

router = APIRouter(prefix="/api/v1/reports/{report_id}/notes", tags=["Case Notes"])


async def _get_report(report_id: uuid.UUID, db: AsyncSession) -> Report:
    result = await db.execute(
        select(Report).where(Report.id == report_id, Report.is_deleted.is_(False))
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


# ── ADMIN: Add note to report ──
@router.post("", response_model=ApiResponse)
async def add_note(
    report_id: uuid.UUID,
    payload: NoteCreate,
    db: AsyncSession = Depends(get_db),
    user: AdminUser = Depends(get_current_user),
) -> ApiResponse:
    report = await _get_report(report_id, db)

    note = CaseNote(
        report_id=report_id,
        author_id=user.id,
        author_name=user.full_name,
        content=encrypt(payload.content),
    )
    db.add(note)
    report.notes_count += 1
    await db.flush()

    await log_action(
        db, AuditAction.NOTE_ADDED, "case_note", str(note.id),
        actor=user, metadata={"report_id": str(report_id)},
    )
    await db.commit()
    await db.refresh(note)

    data = NoteItem.model_validate(note).model_dump(mode="json")
    data["content"] = decrypt(data["content"])
    return ApiResponse(data=data)


# ── ADMIN: List notes for a report ──
@router.get("", response_model=ApiResponse)
async def list_notes(
    report_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _user: AdminUser = Depends(get_current_user),
) -> ApiResponse:
    await _get_report(report_id, db)

    result = await db.execute(
        select(CaseNote)
        .where(CaseNote.report_id == report_id)
        .order_by(CaseNote.created_at.asc())
    )
    notes = result.scalars().all()

    items = []
    for n in notes:
        d = NoteItem.model_validate(n).model_dump(mode="json")
        d["content"] = decrypt(d["content"])
        items.append(d)
    return ApiResponse(data=items)
