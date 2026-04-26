import time
import uuid as uuid_mod
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from sqlalchemy import text
from starlette.middleware.base import BaseHTTPMiddleware

from app.api.v1.audit import router as audit_router
from app.api.v1.auth import router as auth_router
from app.api.v1.evidence import router as evidence_router
from app.api.v1.notes import router as notes_router
from app.api.v1.reports import router as reports_router
from app.api.v1.ws import router as ws_router
from app.core.config import settings
from app.core.logging import setup_logging
from app.core.rate_limit import limiter
from app.db.session import engine


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    setup_logging()
    structlog.get_logger().info("sawtsafe_starting", environment=settings.ENVIRONMENT)
    async with engine.begin() as conn:
        await conn.execute(text("SELECT 1"))
        # Add ip_address column to audit_logs if missing
        await conn.execute(text(
            "ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS"
            " ip_address VARCHAR(45)"
        ))
        # Add user_agent column to audit_logs if missing
        await conn.execute(text(
            "ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS"
            " user_agent VARCHAR(512)"
        ))
        # Add hash chain columns to audit_logs if missing
        await conn.execute(text(
            "ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS"
            " record_hash VARCHAR(64)"
        ))
        await conn.execute(text(
            "ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS"
            " prev_hash VARCHAR(64)"
        ))
        # Add sentiment JSONB column to reports if missing
        await conn.execute(text(
            "ALTER TABLE reports ADD COLUMN IF NOT EXISTS"
            " sentiment JSONB"
        ))
        # Add encryption_iv column to evidence if missing
        await conn.execute(text(
            "ALTER TABLE evidence ADD COLUMN IF NOT EXISTS"
            " encryption_iv VARCHAR(24)"
        ))
        # Add EU Directive deadline columns to reports if missing
        await conn.execute(text(
            "ALTER TABLE reports ADD COLUMN IF NOT EXISTS"
            " acknowledgment_due TIMESTAMPTZ"
        ))
        await conn.execute(text(
            "ALTER TABLE reports ADD COLUMN IF NOT EXISTS"
            " feedback_due TIMESTAMPTZ"
        ))
        await conn.execute(text(
            "ALTER TABLE reports ADD COLUMN IF NOT EXISTS"
            " feedback_given_at TIMESTAMPTZ"
        ))
        # Add status_history JSONB column for per-step timestamps
        await conn.execute(text(
            "ALTER TABLE reports ADD COLUMN IF NOT EXISTS"
            " status_history JSONB DEFAULT '[]'"
        ))
        # Create resolution_type enum type + column on reports
        await conn.execute(text(
            "DO $$ BEGIN"
            " CREATE TYPE resolution_type AS ENUM"
            " ('SUBSTANTIATED','UNSUBSTANTIATED','INCONCLUSIVE','REFERRED');"
            " EXCEPTION WHEN duplicate_object THEN NULL;"
            " END $$"
        ))
        await conn.execute(text(
            "ALTER TABLE reports ADD COLUMN IF NOT EXISTS"
            " resolution_type resolution_type"
        ))
        # Add last_active_at column to admin_users for session timeout
        await conn.execute(text(
            "ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS"
            " last_active_at TIMESTAMPTZ"
        ))
        # Sync audit_action enum with Python AuditAction values
        for val in (
            "ADMIN_ROLE_CHANGED", "ADMIN_DEACTIVATED",
            "ADMIN_ACTIVATED", "ADMIN_DELETED",
            "ADMIN_PASSWORD_RESET", "ADMIN_PASSWORD_CHANGED",
            "REPORT_PURGED", "REPORT_ERASED",
            "REPORT_EXPORTED", "REPORT_VIEWED",
        ):
            await conn.execute(text(
                f"ALTER TYPE audit_action ADD VALUE"
                f" IF NOT EXISTS '{val}'"
            ))
        # ── Immutable audit logs ──
        # Trigger function that blocks UPDATE/DELETE
        await conn.execute(text("""
            CREATE OR REPLACE FUNCTION audit_logs_immutable()
            RETURNS TRIGGER AS $$
            BEGIN
                RAISE EXCEPTION
                    'audit_logs is append-only: % denied',
                    TG_OP;
            END;
            $$ LANGUAGE plpgsql;
        """))
        # Block UPDATE
        await conn.execute(text("""
            DO $$ BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_trigger
                WHERE tgname = 'trg_audit_logs_no_update'
            ) THEN
                CREATE TRIGGER trg_audit_logs_no_update
                BEFORE UPDATE ON audit_logs
                FOR EACH ROW
                EXECUTE FUNCTION audit_logs_immutable();
            END IF;
            END $$;
        """))
        # Block DELETE
        await conn.execute(text("""
            DO $$ BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_trigger
                WHERE tgname = 'trg_audit_logs_no_delete'
            ) THEN
                CREATE TRIGGER trg_audit_logs_no_delete
                BEFORE DELETE ON audit_logs
                FOR EACH ROW
                EXECUTE FUNCTION audit_logs_immutable();
            END IF;
            END $$;
        """))
    yield
    await engine.dispose()


app = FastAPI(
    title="Sawt Safe API",
    description="Enterprise Whistleblowing Platform",
    version="0.1.0",
    lifespan=lifespan,
)

# ── Rate Limiting ──
app.state.limiter = limiter


def _rate_limit_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    return JSONResponse(
        status_code=429,
        content={
            "success": False,
            "data": None,
            "error": f"Rate limit exceeded: {exc.detail}",
            "meta": None,
        },
    )


app.add_exception_handler(RateLimitExceeded, _rate_limit_handler)  # type: ignore[arg-type]

# ── CORS ──
_origins = [
    o.strip()
    for o in settings.CORS_ORIGINS.split(",")
    if o.strip()
]
if not _origins:
    _origins = [
        "https://sawtsafe-web-99513386035.me-central1.run.app",
        "http://localhost:3000",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Security Headers ──
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:  # type: ignore[override]
        response = await call_next(request)
        response.headers["Strict-Transport-Security"] = (
            "max-age=63072000; includeSubDomains; preload"
        )
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; frame-ancestors 'none'"
        )
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = (
            "camera=(), microphone=(), geolocation=()"
        )
        return response


app.add_middleware(SecurityHeadersMiddleware)


# ── Request Logging Middleware ──
class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:  # type: ignore[override]
        request_id = str(uuid_mod.uuid4())[:8]
        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(
            request_id=request_id,
            method=request.method,
            path=request.url.path,
        )
        logger = structlog.get_logger()
        start = time.perf_counter()
        response = await call_next(request)
        duration_ms = round((time.perf_counter() - start) * 1000, 1)
        logger.info(
            "request_completed",
            status_code=response.status_code,
            duration_ms=duration_ms,
        )
        response.headers["X-Request-ID"] = request_id
        return response


app.add_middleware(RequestLoggingMiddleware)

app.include_router(auth_router)
app.include_router(reports_router)
app.include_router(evidence_router)
app.include_router(notes_router)
app.include_router(audit_router)
app.include_router(ws_router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/")
async def root() -> dict[str, str]:
    return {"service": "sawtsafe-api", "version": "0.1.0"}
