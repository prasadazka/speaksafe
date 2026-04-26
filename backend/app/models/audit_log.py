import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class AuditAction(str, enum.Enum):
    REPORT_CREATED = "REPORT_CREATED"
    REPORT_STATUS_UPDATED = "REPORT_STATUS_UPDATED"
    REPORT_SEVERITY_UPDATED = "REPORT_SEVERITY_UPDATED"
    REPORT_DELETED = "REPORT_DELETED"
    EVIDENCE_UPLOADED = "EVIDENCE_UPLOADED"
    EVIDENCE_DELETED = "EVIDENCE_DELETED"
    NOTE_ADDED = "NOTE_ADDED"
    ADMIN_REGISTERED = "ADMIN_REGISTERED"
    ADMIN_LOGIN = "ADMIN_LOGIN"
    ADMIN_ROLE_CHANGED = "ADMIN_ROLE_CHANGED"
    ADMIN_DEACTIVATED = "ADMIN_DEACTIVATED"
    ADMIN_ACTIVATED = "ADMIN_ACTIVATED"
    ADMIN_DELETED = "ADMIN_DELETED"
    ADMIN_PASSWORD_RESET = "ADMIN_PASSWORD_RESET"
    ADMIN_PASSWORD_CHANGED = "ADMIN_PASSWORD_CHANGED"
    REPORT_PURGED = "REPORT_PURGED"
    REPORT_ERASED = "REPORT_ERASED"
    REPORT_EXPORTED = "REPORT_EXPORTED"
    REPORT_VIEWED = "REPORT_VIEWED"


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    actor_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True, index=True
    )
    actor_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    action: Mapped[AuditAction] = mapped_column(
        Enum(AuditAction, name="audit_action"), nullable=False, index=True
    )
    resource_type: Mapped[str] = mapped_column(String(50), nullable=False)
    resource_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(512), nullable=True)
    metadata_: Mapped[dict | None] = mapped_column("metadata", JSONB, nullable=True)
    record_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    prev_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )
