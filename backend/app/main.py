from fastapi import FastAPI

app = FastAPI(
    title="SpeakSafe API",
    description="Enterprise Whistleblowing Platform",
    version="0.1.0",
)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/")
async def root() -> dict[str, str]:
    return {"service": "speaksafe-api", "version": "0.1.0"}
