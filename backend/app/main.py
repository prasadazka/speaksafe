from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from sqlalchemy import text

from app.api.v1.audit import router as audit_router
from app.api.v1.auth import router as auth_router
from app.api.v1.evidence import router as evidence_router
from app.api.v1.notes import router as notes_router
from app.api.v1.reports import router as reports_router
from app.db.session import engine


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    async with engine.connect() as conn:
        await conn.execute(text("SELECT 1"))
    yield
    await engine.dispose()


app = FastAPI(
    title="SpeakSafe API",
    description="Enterprise Whistleblowing Platform",
    version="0.1.0",
    lifespan=lifespan,
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
    return {"service": "speaksafe-api", "version": "0.1.0"}
