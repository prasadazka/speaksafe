from datetime import datetime, timezone

import pyotp
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.security import create_access_token, hash_password, verify_password
from app.db.session import get_db
from app.models.admin_user import AdminUser
from app.models.audit_log import AuditAction
from app.schemas.auth import (
    AdminLogin,
    AdminProfile,
    AdminRegister,
    MFASetupResponse,
    MFAVerify,
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
