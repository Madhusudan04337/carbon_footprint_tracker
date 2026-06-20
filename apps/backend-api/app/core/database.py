from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import QueuePool, NullPool
from app.core.config import settings
import logging

logger = logging.getLogger("ecotrace-api")

def _build_engine():
    """
    Build the SQLAlchemy engine with appropriate settings for the environment.

    Cloud SQL Auth Proxy (Unix socket) configuration:
      • DATABASE_URL = postgresql+psycopg2://user:pass@/dbname?host=/cloudsql/...
      • Uses QueuePool with tuned pool_size to share connections across gunicorn workers

    SQLite (local dev / testing):
      • check_same_thread=False allows the same connection across threads
      • NullPool is used for SQLite to avoid connection sharing issues

    PostgreSQL (local Docker):
      • Standard TCP connection: postgresql://user:pass@localhost:5432/dbname
    """

    is_sqlite = settings.DATABASE_URL.startswith("sqlite")
    is_postgres = settings.DATABASE_URL.startswith("postgresql")

    if is_sqlite:
        logger.info("[Database] Using SQLite (development/test mode)")
        return create_engine(
            settings.DATABASE_URL,
            connect_args={"check_same_thread": False},
            poolclass=NullPool,   # No pooling for SQLite — it's file-based
            echo=(settings.ENVIRONMENT == "development"),
        )

    if is_postgres:
        # Cloud SQL Auth Proxy via Unix socket uses ?host=/cloudsql/... query param.
        # Regular TCP uses host:port in the URL.
        is_cloud_sql = "/cloudsql/" in settings.DATABASE_URL
        logger.info(
            f"[Database] Using PostgreSQL — "
            f"{'Cloud SQL Auth Proxy (Unix socket)' if is_cloud_sql else 'TCP connection'}"
        )
        return create_engine(
            settings.DATABASE_URL,
            poolclass=QueuePool,
            pool_size=settings.DB_POOL_SIZE,
            max_overflow=settings.DB_MAX_OVERFLOW,
            pool_timeout=settings.DB_POOL_TIMEOUT,
            pool_recycle=settings.DB_POOL_RECYCLE,
            pool_pre_ping=True,     # Validates connection before each use (detects dropped connections)
            echo=(settings.ENVIRONMENT == "development"),
        )

    raise ValueError(f"Unsupported DATABASE_URL scheme: {settings.DATABASE_URL[:20]}")


engine = _build_engine()

# Connection event: log when a new connection is established
@event.listens_for(engine, "connect")
def on_connect(dbapi_connection, connection_record):
    logger.debug("[Database] New connection established")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI dependency: yields a database session, always closes on exit."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
