import hashlib
import json
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.admin_user import AdminUser
from app.models.audit_log import AuditAction, AuditLog

# Genesis hash — used as prev_hash for the very first record
GENESIS_HASH = "0" * 64


def compute_record_hash(
    action: str,
    resource_type: str,
    resource_id: str,
    actor_email: str | None,
    timestamp: str,
    prev_hash: str,
    metadata: dict | None = None,
) -> str:
    """Compute SHA-256 hash of an audit log record.

    The hash covers all semantically important fields plus the
    previous record's hash, forming a tamper-evident chain.
    """
    payload = (
        f"{action}|{resource_type}|{resource_id}|"
        f"{actor_email or ''}|{timestamp}|{prev_hash}"
    )
    if metadata:
        payload += "|" + json.dumps(metadata, sort_keys=True)
    return hashlib.sha256(payload.encode()).hexdigest()


async def _get_last_hash(db: AsyncSession) -> str:
    """Fetch record_hash of the most recent audit log entry."""
    result = await db.execute(
        select(AuditLog.record_hash)
        .where(AuditLog.record_hash.is_not(None))
        .order_by(AuditLog.created_at.desc())
        .limit(1)
    )
    last = result.scalar_one_or_none()
    return last if last else GENESIS_HASH


async def log_action(
    db: AsyncSession,
    action: AuditAction,
    resource_type: str,
    resource_id: str,
    actor: AdminUser | None = None,
    metadata: dict | None = None,
    ip_address: str | None = None,
    user_agent: str | None = None,
) -> None:
    prev_hash = await _get_last_hash(db)
    now = datetime.now(timezone.utc).isoformat()
    actor_email = actor.email if actor else None

    record_hash = compute_record_hash(
        action=action.value,
        resource_type=resource_type,
        resource_id=resource_id,
        actor_email=actor_email,
        timestamp=now,
        prev_hash=prev_hash,
        metadata=metadata,
    )

    entry = AuditLog(
        actor_id=actor.id if actor else None,
        actor_email=actor_email,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        ip_address=ip_address,
        user_agent=user_agent[:512] if user_agent else None,
        metadata_=metadata,
        record_hash=record_hash,
        prev_hash=prev_hash,
    )
    db.add(entry)
