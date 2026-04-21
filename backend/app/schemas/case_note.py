import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class NoteCreate(BaseModel):
    content: str = Field(min_length=1, max_length=5000)


class NoteItem(BaseModel):
    id: uuid.UUID
    report_id: uuid.UUID
    author_id: uuid.UUID | None
    author_name: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}
