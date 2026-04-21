import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.admin_user import AdminUser
from app.models.audit_log import AuditAction, AuditLog


async def log_action(
    db: AsyncSession,
    action: AuditAction,
    resource_type: str,
    resource_id: str,
    actor: AdminUser | None = None,
    metadata: dict | None = None,
) -> None:
    entry = AuditLog(
        actor_id=actor.id if actor else None,
        actor_email=actor.email if actor else None,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        metadata_=metadata,
    )
    db.add(entry)
