import uuid
from datetime import datetime

from pydantic import BaseModel


class EvidenceItem(BaseModel):
    id: uuid.UUID
    report_id: uuid.UUID
    file_name: str
    mime_type: str
    size_bytes: int
    uploaded_by: str
    created_at: datetime

    model_config = {"from_attributes": True}
