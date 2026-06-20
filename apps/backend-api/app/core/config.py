import os
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("ecotrace-api")

class Settings:
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "EcoTrace Carbon Footprint API")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    # ── Security ──────────────────────────────────────────────────────────────
    # On Cloud Run: injected from Secret Manager via --set-secrets
    # Locally: read from .env file
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "ecotrace_default_super_secret_signing_key_change_me")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

    # ── Database ──────────────────────────────────────────────────────────────
    # Cloud Run + Cloud SQL Auth Proxy connection string format:
    #   postgresql+psycopg2://user:pass@/dbname?host=/cloudsql/project:region:instance
    # Local development:
    #   postgresql://user:pass@localhost:5432/ecotrace_db
    # Testing (SQLite):
    #   sqlite:///./test.db
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./ecotrace.db")

    # ── Connection Pool ───────────────────────────────────────────────────────
    # Cloud SQL Auth Proxy supports up to 100 connections by default.
    # pool_size: persistent connections kept open per worker
    # max_overflow: extra connections allowed beyond pool_size under load
    # pool_timeout: seconds to wait for a connection before raising
    # pool_recycle: recycle connections older than N seconds (avoids stale)
    DB_POOL_SIZE: int = int(os.getenv("DB_POOL_SIZE", "5"))
    DB_MAX_OVERFLOW: int = int(os.getenv("DB_MAX_OVERFLOW", "10"))
    DB_POOL_TIMEOUT: int = int(os.getenv("DB_POOL_TIMEOUT", "30"))
    DB_POOL_RECYCLE: int = int(os.getenv("DB_POOL_RECYCLE", "1800"))

    # ── CORS ──────────────────────────────────────────────────────────────────
    ALLOWED_ORIGINS: list = [
        origin.strip().strip('"').strip("'")
        for origin in os.getenv("ALLOWED_ORIGINS", "*").split(",")
    ]

    # ── Cloud Run / GCP ───────────────────────────────────────────────────────
    # Cloud Run sets $PORT at runtime (default 8080)
    PORT: int = int(os.getenv("PORT", "8080"))
    # Worker count for gunicorn (set via WEB_CONCURRENCY env in deploy scripts)
    WEB_CONCURRENCY: int = int(os.getenv("WEB_CONCURRENCY", "2"))
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "info")

    def __post_init__(self):
        # Warn if using the default insecure JWT key in a non-dev environment
        if (self.ENVIRONMENT != "development"
                and self.JWT_SECRET_KEY == "ecotrace_default_super_secret_signing_key_change_me"):
            logger.warning(
                "[Security] JWT_SECRET_KEY is using the default insecure value! "
                "Set it via Secret Manager in production."
            )

settings = Settings()
settings.__post_init__()
