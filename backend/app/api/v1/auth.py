from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.security import create_access_token, hash_password, verify_password
from app.db.session import get_db
from app.models.admin_user import AdminUser
from app.schemas.auth import AdminLogin, AdminProfile, AdminRegister, TokenResponse
from app.schemas.report import ApiResponse

router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])


# ── Register ──
@router.post("/register", response_model=ApiResponse, status_code=status.HTTP_201_CREATED)
async def register(
    payload: AdminRegister,
    db: AsyncSession = Depends(get_db),
) -> ApiResponse:
    # Check duplicate email
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

    # Update last login
    user.last_login_at = datetime.now(timezone.utc)
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
