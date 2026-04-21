import datetime
import enum
import random
import uuid

from sqlalchemy import Boolean, Date, DateTime, Enum, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
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


def generate_tracking_id() -> str:
    """Generate a tracking ID like SS-2026-A7K2.

    Uses 4 alphanumeric chars (0-9, A-Z excluding ambiguous I/O/L),
    giving ~33^4 = ~1.2 million unique IDs per year — far safer than
    the old 4-digit random which only had 9,000 possibilities.
    """
    year = datetime.datetime.now().year
    alphabet = "0123456789ABCDEFGHJKMNPQRSTUVWXYZ"  # 33 chars, no I/O/L
    code = "".join(random.choices(alphabet, k=4))
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
    description: Mapped[str] = mapped_column(Text, nullable=False)
    occurred_at: Mapped[datetime.date | None] = mapped_column(Date, nullable=True)
    location: Mapped[str | None] = mapped_column(String(200), nullable=True)
    status: Mapped[ReportStatus] = mapped_column(
        Enum(ReportStatus, name="report_status"), nullable=False, default=ReportStatus.OPEN
    )
    resolution: Mapped[str | None] = mapped_column(Text, nullable=True)
    assigned_to: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )
    evidence_count: Mapped[int] = mapped_column(Integer, default=0)
    notes_count: Mapped[int] = mapped_column(Integer, default=0)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
