import datetime
import enum
import secrets
import uuid

from sqlalchemy import Boolean, Date, DateTime, Enum, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class ReportCategory(str, enum.Enum):
    FRAUD = "FRAUD"
    HARASSMENT = "HARASSMENT"
    DISCRIMINATION = "DISCRIMINATION"
    DATA_MISUSE = "DATA_MISUSE"
    POLICY_VIOLATION = "POLICY_VIOLATION"
    SAFETY_CONCERN = "SAFETY_CONCERN"
    CORRUPTION = "CORRUPTION"
    ENVIRONMENTAL = "ENVIRONMENTAL"
    RETALIATION = "RETALIATION"
    OTHER = "OTHER"


class Severity(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class ReportStatus(str, enum.Enum):
    OPEN = "OPEN"
    UNDER_REVIEW = "UNDER_REVIEW"
    INVESTIGATING = "INVESTIGATING"
    CLOSED = "CLOSED"


class ResolutionType(str, enum.Enum):
    SUBSTANTIATED = "SUBSTANTIATED"
    UNSUBSTANTIATED = "UNSUBSTANTIATED"
    INCONCLUSIVE = "INCONCLUSIVE"
    REFERRED = "REFERRED"


def generate_tracking_id() -> str:
    """Generate a tracking ID like SS-2026-A7K2X9MN.

    Uses 8 cryptographically-secure alphanumeric chars (0-9, A-Z
    excluding ambiguous I/O/L) via the ``secrets`` module.
    33^8 ≈ 1.4 trillion combinations — at 20 req/min rate-limit
    brute-force would take ~133 million years.
    """
    year = datetime.datetime.now().year
    alphabet = "0123456789ABCDEFGHJKMNPQRSTUVWXYZ"  # 33 chars, no I/O/L
    code = "".join(secrets.choice(alphabet) for _ in range(8))
    return f"SS-{year}-{code}"


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    tracking_id: Mapped[str] = mapped_column(
        String(20), unique=True, nullable=False, default=generate_tracking_id, index=True
    )
    category: Mapped[ReportCategory] = mapped_column(
        Enum(ReportCategory, name="report_category"), nullable=False
    )
    severity: Mapped[Severity] = mapped_column(
        Enum(Severity, name="severity"), nullable=False, default=Severity.LOW
    )
    sentiment: Mapped[dict | None] = mapped_column(
        JSONB, nullable=True, default=None
    )
    description: Mapped[str] = mapped_column(Text, nullable=False)
    occurred_at: Mapped[datetime.date | None] = mapped_column(Date, nullable=True)
    location: Mapped[str | None] = mapped_column(String(200), nullable=True)
    status: Mapped[ReportStatus] = mapped_column(
        Enum(ReportStatus, name="report_status"), nullable=False, default=ReportStatus.OPEN
    )
    resolution: Mapped[str | None] = mapped_column(Text, nullable=True)
    resolution_type: Mapped[ResolutionType | None] = mapped_column(
        Enum(ResolutionType, name="resolution_type"), nullable=True
    )
    assigned_to: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )
    evidence_count: Mapped[int] = mapped_column(Integer, default=0)
    notes_count: Mapped[int] = mapped_column(Integer, default=0)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)

    # ── Status history (per-step timestamps) ──
    status_history: Mapped[list | None] = mapped_column(
        JSONB, nullable=True, default=list
    )

    # ── EU Directive deadlines ──
    acknowledgment_due: Mapped[datetime.datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    feedback_due: Mapped[datetime.datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    feedback_given_at: Mapped[datetime.datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
