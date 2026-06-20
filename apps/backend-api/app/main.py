from fastapi import FastAPI, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

from app.core.config import settings
from app.core.database import engine, Base
from app.api import auth, tracking, goals, analytics, recommendations
from app.middleware.rate_limit import RateLimitMiddleware
from app.core.exceptions import EcoTraceException

# Initialize logging configuration
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("ecotrace-api")

# Auto-migrate database tables on server startup (SQLite/development context)
try:
    Base.metadata.create_all(bind=engine)
    logger.info("[Database] initialization completed. Tables mapped successfully.")
except Exception as e:
    logger.error(f"[Database] initialization failed: {e}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Production-ready FastAPI backend for logging emissions, setting reduction goals, and analytics.",
    version="1.0.0"
)

# CORS Policy configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, swap with actual trusted domain lists
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom Rate Limit middleware (max 100 requests per minute)
app.add_middleware(RateLimitMiddleware, requests_limit=100, window_seconds=60)

# Register Routers
app.include_router(auth.router, prefix="/api")
app.include_router(tracking.router, prefix="/api")
app.include_router(goals.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(recommendations.router, prefix="/api")

# Custom Global Exception Handling
@app.exception_handler(EcoTraceException)
def ecotrace_exception_handler(request: Request, exc: EcoTraceException):
    logger.warning(f"Domain validation error at {request.url.path}: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail}
    )

@app.exception_handler(Exception)
def global_unhandled_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled server error at {request.url.path}: {exc}", exc_info=True)
    # Mask actual stack details in production context
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"error": "An internal database or connection error occurred."}
    )

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "docs_url": "/docs"
    }
