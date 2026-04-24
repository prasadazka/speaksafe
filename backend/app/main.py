from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api.v1.audit import router as audit_router
from app.api.v1.auth import router as auth_router
from app.api.v1.evidence import router as evidence_router
from app.api.v1.notes import router as notes_router
from app.api.v1.reports import router as reports_router
from app.core.config import settings
from app.db.session import engine


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    async with engine.connect() as conn:
        await conn.execute(text("SELECT 1"))
    yield
    await engine.dispose()


app = FastAPI(
    title="Sawt Safe API",
    description="Enterprise Whistleblowing Platform",
    version="0.1.0",
    lifespan=lifespan,
)

# ── CORS ──
_origins = [
    o.strip()
    for o in settings.CORS_ORIGINS.split(",")
    if o.strip()
]
if not _origins:
    _origins = [
        "https://speaksafe-web-99513386035.me-central1.run.app",
        "https://speaksafe-web-quwukiaoia-ww.a.run.app",
        "http://localhost:3000",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(reports_router)
app.include_router(evidence_router)
app.include_router(notes_router)
app.include_router(audit_router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/")
async def root() -> dict[str, str]:
    return {"service": "sawtsafe-api", "version": "0.1.0"}
