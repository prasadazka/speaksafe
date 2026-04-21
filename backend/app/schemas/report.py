import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.report import ReportCategory, ReportStatus, Severity


# ── Request ──

class ReportCreate(BaseModel):
    category: ReportCategory
    description: str = Field(min_length=10, max_length=5000)
    severity: Severity = Severity.LOW


class ReportStatusUpdate(BaseModel):
    status: ReportStatus


class ReportSeverityUpdate(BaseModel):
    severity: Severity


# ── Response ──

class ReportPublic(BaseModel):
    """What the anonymous reporter sees."""
    tracking_id: str
    status: ReportStatus
    created_at: datetime
    updated_at: datetime


class ReportSubmitted(BaseModel):
    """Returned after successful submission."""
    tracking_id: str
    message: str = "Report submitted successfully. Save your tracking ID."


class ReportDetail(BaseModel):
    """Full report for admin view."""
    id: uuid.UUID
    tracking_id: str
    category: ReportCategory
    severity: Severity
    description: str
    status: ReportStatus
    resolution: str | None
    assigned_to: uuid.UUID | None
    evidence_count: int
    notes_count: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ReportListItem(BaseModel):
    """Compact report for admin list view."""
    id: uuid.UUID
    tracking_id: str
    category: ReportCategory
    severity: Severity
    status: ReportStatus
    evidence_count: int
    notes_count: int
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Envelope ──

class ApiResponse(BaseModel):
    success: bool = True
    data: dict | list | None = None
    error: str | None = None
    meta: dict | None = None
