import uuid
from datetime import datetime

from pydantic import BaseModel


class EvidenceItem(BaseModel):
    id: uuid.UUID
    report_id: uuid.UUID
    file_name: str
    mime_type: str
    size_bytes: int
    encrypted: bool
    uploaded_by: str
    created_at: datetime

    model_config = {"from_attributes": True}

    @classmethod
    def from_evidence(cls, ev: object) -> "EvidenceItem":
        """Build from an Evidence ORM instance, computing `encrypted`."""
        from app.models.evidence import Evidence

        assert isinstance(ev, Evidence)
        return cls(
            id=ev.id,
            report_id=ev.report_id,
            file_name=ev.file_name,
            mime_type=ev.mime_type,
            size_bytes=ev.size_bytes,
            encrypted=ev.encryption_iv is not None,
            uploaded_by=ev.uploaded_by,
            created_at=ev.created_at,
        )
