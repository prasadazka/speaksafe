import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.audit_log import AuditAction


class AuditLogItem(BaseModel):
    id: uuid.UUID
    actor_id: uuid.UUID | None
    actor_email: str | None
    action: AuditAction
    resource_type: str
    resource_id: str
    ip_address: str | None
    metadata_: dict | None
    created_at: datetime

    model_config = {"from_attributes": True}
