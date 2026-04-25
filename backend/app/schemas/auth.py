import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from app.models.admin_user import AdminRole


# ── Request ──

class AdminRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=2, max_length=150)
    role: AdminRole = AdminRole.VIEWER


class AdminLogin(BaseModel):
    email: EmailStr
    password: str
    totp_code: str | None = None


# ── MFA ──

class MFAVerify(BaseModel):
    code: str = Field(min_length=6, max_length=6)


# ── Response ──

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class MFASetupResponse(BaseModel):
    secret: str
    otpauth_url: str


class AdminProfile(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    role: AdminRole
    is_active: bool
    mfa_enabled: bool
    last_login_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}
