from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    DATABASE_URL: str
    SECRET_KEY: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ENCRYPTION_KEY: str = ""
    ENVIRONMENT: str = "development"
    GCS_BUCKET: str = "sawtsafe-evidence"
    CORS_ORIGINS: str = ""

    # ── EU Directive compliance deadlines (configurable) ──
    ACKNOWLEDGMENT_DAYS: int = 7       # Art. 9(1)(b) — receipt confirmation
    FEEDBACK_DEADLINE_DAYS: int = 90   # Art. 9(1)(f) — investigation feedback
    FEEDBACK_WARNING_DAYS: int = 14    # Amber warning threshold before deadline

    # ── Data retention & auto-purge (GDPR Art. 5(1)(e)) ──
    RETENTION_DAYS: int = 365          # Days after closure before hard-delete

    # ── Session timeout (SOC 2 / GDPR operational hardening) ──
    SESSION_TIMEOUT_MINUTES: int = 30  # Inactivity timeout for admin sessions


settings = Settings()
