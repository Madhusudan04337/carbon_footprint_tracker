#!/bin/sh
# =============================================================================
# EcoTrace Backend — Production Startup Script
# =============================================================================
# Uses gunicorn as the process manager with uvicorn workers.
# Gunicorn handles worker management, restarts on crash, and signal handling.
# Uvicorn workers handle the actual async ASGI requests.
#
# Why gunicorn + uvicorn workers instead of plain uvicorn?
#   • gunicorn manages N worker processes (CPU-bound parallelism)
#   • Each worker is a uvicorn UvicornWorker (async I/O inside each process)
#   • Gunicorn gracefully restarts crashed workers automatically
# =============================================================================

set -e  # Exit immediately if any command returns non-zero

echo "[EcoTrace] Starting production server..."
echo "[EcoTrace] Environment : ${ENVIRONMENT:-production}"
echo "[EcoTrace] Port        : ${PORT:-8000}"
echo "[EcoTrace] Workers     : ${WEB_CONCURRENCY:-2}"

# Calculate workers: (2 × CPU cores) + 1 is the standard formula.
# We cap at 4 for container environments where CPU is shared.
WORKERS="${WEB_CONCURRENCY:-2}"

exec gunicorn app.main:app \
    --worker-class uvicorn.workers.UvicornWorker \
    --workers "${WORKERS}" \
    --bind "0.0.0.0:${PORT:-8000}" \
    --timeout 120 \
    --keepalive 5 \
    --log-level "${LOG_LEVEL:-info}" \
    --access-logfile - \
    --error-logfile - \
    --forwarded-allow-ips="*" \
    --proxy-protocol
