import uuid
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.models.report import ReportCategory, ReportStatus, ResolutionType, Severity  # noqa: I001


class SentimentData(BaseModel):
    tone: Literal[
        "FEAR_THREAT", "DISTRESS", "ANGER",
        "DESPERATION", "CONCERN", "NEUTRAL",
    ]
    urgency: Literal["CRITICAL", "HIGH", "MEDIUM", "LOW"]
    summary: str = Field(max_length=300)


# ── Request ──

class ReportCreate(BaseModel):
    category: ReportCategory
    description: str = Field(min_length=10, max_length=5000)
    severity: Severity = Severity.LOW
    sentiment: SentimentData | None = None
    occurred_at: date | None = None
    location: str | None = Field(None, max_length=200)


class ReportStatusUpdate(BaseModel):
    status: ReportStatus
    resolution_type: ResolutionType | None = None


class ReportSeverityUpdate(BaseModel):
    severity: Severity


# ── Response ──


class StatusHistoryEntry(BaseModel):
    status: str
    at: datetime


class ReportPublic(BaseModel):
    """What the anonymous reporter sees."""
    tracking_id: str
    status: ReportStatus
    resolution_type: ResolutionType | None = None
    created_at: datetime
    updated_at: datetime
    acknowledgment_due: datetime | None = None
    feedback_due: datetime | None = None
    feedback_given_at: datetime | None = None
    status_history: list[StatusHistoryEntry] = []


class ReportSubmitted(BaseModel):
    """Returned after successful submission."""
    id: uuid.UUID
    tracking_id: str
    message: str = "Report submitted successfully. Save your tracking ID."


class ReportDetail(BaseModel):
    """Full report for admin view."""
    id: uuid.UUID
    tracking_id: str
    category: ReportCategory
    severity: Severity
    sentiment: dict | None = None
    description: str
    occurred_at: date | None
    location: str | None
    status: ReportStatus
    resolution: str | None
    resolution_type: ResolutionType | None = None
    assigned_to: uuid.UUID | None
    evidence_count: int
    notes_count: int
    acknowledgment_due: datetime | None = None
    feedback_due: datetime | None = None
    feedback_given_at: datetime | None = None
    status_history: list[StatusHistoryEntry] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ReportListItem(BaseModel):
    """Compact report for admin list view."""
    id: uuid.UUID
    tracking_id: str
    category: ReportCategory
    severity: Severity
    sentiment: dict | None = None
    status: ReportStatus
    description: str
    resolution_type: ResolutionType | None = None
    occurred_at: date | None
    location: str | None
    evidence_count: int
    notes_count: int
    acknowledgment_due: datetime | None = None
    feedback_due: datetime | None = None
    feedback_given_at: datetime | None = None
    status_history: list[StatusHistoryEntry] = []
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Envelope ──

class ApiResponse(BaseModel):
    success: bool = True
    data: dict | list | None = None
    error: str | None = None
    meta: dict | None = None
