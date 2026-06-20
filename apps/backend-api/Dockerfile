# =============================================================================
# EcoTrace FastAPI Backend — Production Dockerfile
# Multi-stage build: build stage pins deps, runtime stage runs as non-root
# =============================================================================

# ──────────────────────────────────────────────────────────────────────────────
# STAGE 1 — builder
#   • Installs only the packages needed to compile wheels (psycopg2, bcrypt, etc.)
#   • All heavy build tooling stays in this layer and never ships to production
# ──────────────────────────────────────────────────────────────────────────────
FROM python:3.12-slim AS builder

# Prevent Python from writing .pyc files and buffering stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /build

# Install OS-level build dependencies required to compile psycopg2 & bcrypt C-extensions.
# --no-install-recommends keeps the layer as lean as possible.
# These are NOT copied to the final image.
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy only requirements first — this layer is cached unless requirements.txt changes,
# meaning a code change alone does NOT re-install all packages (faster rebuilds).
COPY requirements.txt .

# Build all wheels into /wheels so the runtime stage can install without a compiler
RUN pip wheel --no-cache-dir --wheel-dir /wheels -r requirements.txt


# ──────────────────────────────────────────────────────────────────────────────
# STAGE 2 — runtime
#   • Starts from the same slim base, zero build tools
#   • Copies pre-built wheels from the builder stage
#   • Creates a dedicated non-root user (ecotrace) for security
# ──────────────────────────────────────────────────────────────────────────────
FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    # Application config defaults — overridden by docker-compose env_file
    ENVIRONMENT=production \
    PORT=8000

WORKDIR /app

# Install only the libpq runtime shared library (needed by psycopg2 at runtime).
# No gcc or build-essential — attack surface is minimal.
RUN apt-get update && apt-get install -y --no-install-recommends \
        libpq5 \
        curl \
    && rm -rf /var/lib/apt/lists/*

# Install pre-built wheels — no compiler needed, no internet required at runtime
COPY --from=builder /wheels /wheels
RUN pip install --no-cache-dir --no-index --find-links=/wheels /wheels/* \
    && rm -rf /wheels

# ── Security: create a dedicated non-root user ────────────────────────────────
# UID/GID 1001 avoids conflict with common system UIDs.
# --no-create-home keeps the image clean.
RUN groupadd --gid 1001 ecotrace \
    && useradd --uid 1001 --gid ecotrace --no-create-home --shell /sbin/nologin ecotrace

# Copy application source code
COPY --chown=ecotrace:ecotrace app/ ./app/

# Copy the production startup script and make it executable
COPY --chown=ecotrace:ecotrace scripts/start.sh ./scripts/start.sh
RUN chmod +x ./scripts/start.sh

# Drop root privileges — everything from here runs as ecotrace
USER ecotrace

# Expose the application port
EXPOSE 8000

# Health check: polls the root endpoint every 30s.
# --start-period gives the app 10s to initialise before first check.
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/ || exit 1

# Production entrypoint: gunicorn + uvicorn workers for multi-process serving
CMD ["./scripts/start.sh"]
