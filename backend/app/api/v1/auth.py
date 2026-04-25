import uuid
from datetime import datetime, timezone

import pyotp
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func as sa_func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_role
from app.core.security import create_access_token, hash_password, verify_password
from app.db.session import get_db
from app.models.admin_user import AdminRole, AdminUser
from app.models.audit_log import AuditAction
from app.schemas.auth import (
    ActiveUpdate,
    AdminLogin,
    AdminProfile,
    AdminRegister,
    AdminUserListItem,
    MFASetupResponse,
    MFAVerify,
    PasswordReset,
    RoleUpdate,
    TokenResponse,
)
from app.schemas.report import ApiResponse
from app.services.audit import log_action

router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])


# ── Register ──
@router.post("/register", response_model=ApiResponse, status_code=status.HTTP_201_CREATED)
async def register(
    payload: AdminRegister,
    db: AsyncSession = Depends(get_db),
) -> ApiResponse:
    existing = await db.execute(select(AdminUser).where(AdminUser.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email already registered")

    user = AdminUser(
        email=payload.email,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name,
        role=payload.role,
    )
    db.add(user)
    await db.flush()

    await log_action(
        db, AuditAction.ADMIN_REGISTERED, "admin_user", str(user.id),
        metadata={"email": payload.email, "role": payload.role.value},
    )
    await db.commit()
    await db.refresh(user)

    token = create_access_token(user.id)
    return ApiResponse(
        data=TokenResponse(access_token=token).model_dump(),
    )


# ── Login ──
@router.post("/login", response_model=ApiResponse)
async def login(
    payload: AdminLogin,
    db: AsyncSession = Depends(get_db),
) -> ApiResponse:
    result = await db.execute(
        select(AdminUser).where(AdminUser.email == payload.email, AdminUser.is_active.is_(True))
    )
    user = result.scalar_one_or_none()

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # MFA check
    if user.mfa_enabled and user.mfa_secret:
        if not payload.totp_code:
            return ApiResponse(
                data={"mfa_required": True},
            )
        totp = pyotp.TOTP(user.mfa_secret)
        if not totp.verify(payload.totp_code, valid_window=1):
            raise HTTPException(status_code=401, detail="Invalid MFA code")

    user.last_login_at = datetime.now(timezone.utc)
    await log_action(
        db, AuditAction.ADMIN_LOGIN, "admin_user", str(user.id), actor=user,
    )
    await db.commit()

    token = create_access_token(user.id)
    return ApiResponse(
        data=TokenResponse(access_token=token).model_dump(),
    )


# ── Get current user profile ──
@router.get("/me", response_model=ApiResponse)
async def get_me(
    user: AdminUser = Depends(get_current_user),
) -> ApiResponse:
    return ApiResponse(
        data=AdminProfile.model_validate(user).model_dump(mode="json"),
    )


# ── MFA: Generate setup secret + QR URL ──
@router.post("/mfa/setup", response_model=ApiResponse)
async def mfa_setup(
    db: AsyncSession = Depends(get_db),
    user: AdminUser = Depends(get_current_user),
) -> ApiResponse:
    if user.mfa_enabled:
        raise HTTPException(status_code=400, detail="MFA is already enabled")

    secret = pyotp.random_base32()
    user.mfa_secret = secret
    await db.commit()

    totp = pyotp.TOTP(secret)
    otpauth_url = totp.provisioning_uri(name=user.email, issuer_name="Sawt Safe")

    return ApiResponse(
        data=MFASetupResponse(secret=secret, otpauth_url=otpauth_url).model_dump(),
    )


# ── MFA: Verify code and enable ──
@router.post("/mfa/verify", response_model=ApiResponse)
async def mfa_verify(
    payload: MFAVerify,
    db: AsyncSession = Depends(get_db),
    user: AdminUser = Depends(get_current_user),
) -> ApiResponse:
    if user.mfa_enabled:
        raise HTTPException(status_code=400, detail="MFA is already enabled")
    if not user.mfa_secret:
        raise HTTPException(status_code=400, detail="Call /mfa/setup first")

    totp = pyotp.TOTP(user.mfa_secret)
    if not totp.verify(payload.code, valid_window=1):
        raise HTTPException(status_code=400, detail="Invalid code. Try again.")

    user.mfa_enabled = True
    await db.commit()

    return ApiResponse(data={"message": "MFA enabled successfully"})


# ── MFA: Disable ──
@router.post("/mfa/disable", response_model=ApiResponse)
async def mfa_disable(
    payload: MFAVerify,
    db: AsyncSession = Depends(get_db),
    user: AdminUser = Depends(get_current_user),
) -> ApiResponse:
    if not user.mfa_enabled:
        raise HTTPException(status_code=400, detail="MFA is not enabled")

    totp = pyotp.TOTP(user.mfa_secret)
    if not totp.verify(payload.code, valid_window=1):
        raise HTTPException(status_code=400, detail="Invalid code")

    user.mfa_enabled = False
    user.mfa_secret = None
    await db.commit()

    return ApiResponse(data={"message": "MFA disabled"})


# ── User Management (ADMIN only) ──


@router.get("/users", response_model=ApiResponse)
async def list_users(
    page: int = 1,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    admin: AdminUser = Depends(require_role(AdminRole.ADMIN)),
) -> ApiResponse:
    offset = (page - 1) * limit
    result = await db.execute(
        select(AdminUser).order_by(AdminUser.created_at.desc()).offset(offset).limit(limit)
    )
    users = result.scalars().all()

    total_result = await db.execute(select(sa_func.count(AdminUser.id)))
    total = total_result.scalar() or 0

    return ApiResponse(
        data=[AdminUserListItem.model_validate(u).model_dump(mode="json") for u in users],
        meta={"page": page, "limit": limit, "total": total},
    )


@router.patch("/users/{user_id}/role", response_model=ApiResponse)
async def update_user_role(
    user_id: uuid.UUID,
    payload: RoleUpdate,
    db: AsyncSession = Depends(get_db),
    admin: AdminUser = Depends(require_role(AdminRole.ADMIN)),
) -> ApiResponse:
    if admin.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot change your own role")

    result = await db.execute(select(AdminUser).where(AdminUser.id == user_id))
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    old_role = target.role.value
    target.role = payload.role

    await log_action(
        db, AuditAction.ADMIN_ROLE_CHANGED, "admin_user", str(user_id),
        actor=admin,
        metadata={"email": target.email, "old_role": old_role, "new_role": payload.role.value},
    )
    await db.commit()

    return ApiResponse(
        data=AdminUserListItem.model_validate(target).model_dump(mode="json"),
    )


@router.patch("/users/{user_id}/active", response_model=ApiResponse)
async def update_user_active(
    user_id: uuid.UUID,
    payload: ActiveUpdate,
    db: AsyncSession = Depends(get_db),
    admin: AdminUser = Depends(require_role(AdminRole.ADMIN)),
) -> ApiResponse:
    if admin.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot deactivate yourself")

    result = await db.execute(select(AdminUser).where(AdminUser.id == user_id))
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    target.is_active = payload.is_active
    action = AuditAction.ADMIN_ACTIVATED if payload.is_active else AuditAction.ADMIN_DEACTIVATED

    await log_action(
        db, action, "admin_user", str(user_id),
        actor=admin,
        metadata={"email": target.email, "is_active": payload.is_active},
    )
    await db.commit()

    return ApiResponse(
        data=AdminUserListItem.model_validate(target).model_dump(mode="json"),
    )


@router.delete("/users/{user_id}", response_model=ApiResponse)
async def delete_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    admin: AdminUser = Depends(require_role(AdminRole.ADMIN)),
) -> ApiResponse:
    if admin.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")

    result = await db.execute(select(AdminUser).where(AdminUser.id == user_id))
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    await log_action(
        db, AuditAction.ADMIN_DELETED, "admin_user", str(user_id),
        actor=admin,
        metadata={"email": target.email, "role": target.role.value},
    )
    await db.delete(target)
    await db.commit()

    return ApiResponse(data={"message": "User deleted"})


@router.patch("/users/{user_id}/password", response_model=ApiResponse)
async def reset_user_password(
    user_id: uuid.UUID,
    payload: PasswordReset,
    db: AsyncSession = Depends(get_db),
    admin: AdminUser = Depends(require_role(AdminRole.ADMIN)),
) -> ApiResponse:
    result = await db.execute(select(AdminUser).where(AdminUser.id == user_id))
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    target.password_hash = hash_password(payload.new_password)

    await log_action(
        db, AuditAction.ADMIN_PASSWORD_RESET, "admin_user", str(user_id),
        actor=admin,
        metadata={"email": target.email},
    )
    await db.commit()

    return ApiResponse(data={"message": "Password reset successfully"})
