from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_role
from app.db.session import get_db
from app.models.admin_user import AdminRole, AdminUser
from app.models.audit_log import AuditAction, AuditLog
from app.schemas.audit_log import AuditLogItem
from app.schemas.report import ApiResponse

router = APIRouter(prefix="/api/v1/audit", tags=["Audit Logs"])


# ── ADMIN (ADMIN + COMPLIANCE_OFFICER only): List audit logs ──
@router.get("", response_model=ApiResponse)
async def list_audit_logs(
    action: AuditAction | None = None,
    resource_type: str | None = None,
    resource_id: str | None = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _user: AdminUser = Depends(require_role(AdminRole.ADMIN, AdminRole.COMPLIANCE_OFFICER)),
) -> ApiResponse:
    query = select(AuditLog)

    if action:
        query = query.where(AuditLog.action == action)
    if resource_type:
        query = query.where(AuditLog.resource_type == resource_type)
    if resource_id:
        query = query.where(AuditLog.resource_id == resource_id)

    # Count
    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar() or 0

    # Paginate
    query = query.order_by(AuditLog.created_at.desc())
    query = query.offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    logs = result.scalars().all()

    return ApiResponse(
        data=[AuditLogItem.model_validate(log).model_dump(mode="json") for log in logs],
        meta={"total": total, "page": page, "limit": limit},
    )
