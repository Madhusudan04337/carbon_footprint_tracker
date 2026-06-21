#!/usr/bin/env bash
# =============================================================================
# EcoTrace — Deploy React Frontend to Cloud Run (nginx)
# =============================================================================
# Builds the frontend Docker image with the production API URL baked in,
# pushes to Artifact Registry, and deploys to Cloud Run as a public service.
#
# Usage:
#   export GCP_PROJECT_ID=your-project-id
#   export VITE_API_BASE_URL=https://your-backend-url/api
#   ./deployment/deploy-frontend.sh
# =============================================================================

set -euo pipefail

PROJECT_ID="${GCP_PROJECT_ID:-mystical-surfer-500104-b6}"
REGION="${GCP_REGION:-asia-south1}"
AR_REPO="ecotrace-repo"
SERVICE_NAME="ecotrace-frontend"
IMAGE_TAG="${IMAGE_TAG:-$(git rev-parse --short HEAD 2>/dev/null || echo 'latest')}"
IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPO}/frontend:${IMAGE_TAG}"

# The backend URL must be set — it gets baked into the JS bundle at build time
VITE_API_BASE_URL="${VITE_API_BASE_URL:?Set VITE_API_BASE_URL to your backend Cloud Run URL + /api}"

echo ""
echo "🚀 Deploying EcoTrace Frontend"
echo "   Image       : ${IMAGE}"
echo "   API Base URL: ${VITE_API_BASE_URL}"
echo ""

# ── Step 1: Build and push image (with API URL as build-arg) ─────────────────
echo "▶ [1/3] Building frontend image via Cloud Build..."

gcloud builds submit \
    --config=cloudbuild.yaml \
    --substitutions="_IMAGE=${IMAGE},_SERVICE=frontend,_VITE_API_BASE_URL=${VITE_API_BASE_URL}" \
    --project="${PROJECT_ID}" \
    .

echo "   ✅ Image pushed: ${IMAGE}"

# ── Step 2: Deploy to Cloud Run ───────────────────────────────────────────────
echo "▶ [2/3] Deploying frontend to Cloud Run..."

    # Configure deployment settings for gcloud run deploy:
    # - --allow-unauthenticated: Allow public access (frontend browser-facing SPA)
    # - --cpu, --memory, --cpu-throttling: Light-weight resources for nginx
    # - --min-instances=0: Scale to zero when idle for cost optimization
    # - --max-instances=5: Scale up to 5 instances maximum
    # - --concurrency=1000: Concurrency limit appropriate for serving static files
    # - --port=8080: Port matching nginx config
    gcloud run deploy "${SERVICE_NAME}" \
        --image="${IMAGE}" \
        --region="${REGION}" \
        --platform=managed \
        --project="${PROJECT_ID}" \
        --allow-unauthenticated \
        --cpu=1 \
        --memory=256Mi \
        --cpu-throttling \
        --min-instances=0 \
        --max-instances=5 \
        --concurrency=1000 \
        --port=8080 \
        --ingress=all \
        --timeout=60

echo "   ✅ Frontend deployed."

# ── Step 3: Print service URL ─────────────────────────────────────────────────
echo "▶ [3/3] Fetching service URL..."
SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" \
    --region="${REGION}" \
    --project="${PROJECT_ID}" \
    --format="value(status.url)")

echo ""
echo "╔═══════════════════════════════════════════════╗"
echo "║  Frontend Live: ${SERVICE_URL}  ║"
echo "╚═══════════════════════════════════════════════╝"
