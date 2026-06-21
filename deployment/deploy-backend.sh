#!/usr/bin/env bash
# =============================================================================
# EcoTrace — Deploy FastAPI Backend to Cloud Run
# =============================================================================
# Builds the backend Docker image, pushes to Artifact Registry,
# and deploys to Cloud Run with Cloud SQL, Secret Manager, and autoscaling.
#
# Usage:
#   export GCP_PROJECT_ID=your-project-id
#   ./deployment/deploy-backend.sh [--image-tag=v1.2.3]
# =============================================================================

set -euo pipefail

# ── Configuration (all overridable via environment) ──────────────────────────
PROJECT_ID="${GCP_PROJECT_ID:-mystical-surfer-500104-b6}"
REGION="${GCP_REGION:-asia-south1}"
AR_REPO="ecotrace-repo"
SERVICE_NAME="ecotrace-api"
IMAGE_TAG="${IMAGE_TAG:-$(git rev-parse --short HEAD 2>/dev/null || echo 'latest')}"
IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPO}/backend:${IMAGE_TAG}"
BACKEND_SA="ecotrace-backend-sa@${PROJECT_ID}.iam.gserviceaccount.com"
CLOUDSQL_INSTANCE="${CLOUDSQL_INSTANCE:-mystical-surfer-500104-b6:asia-south1:ecotrace-postgres}"

echo ""
echo "🚀 Deploying EcoTrace Backend"
echo "   Image  : ${IMAGE}"
echo "   Region : ${REGION}"
echo "   Service: ${SERVICE_NAME}"
echo ""

# ── Step 1: Build and push Docker image ──────────────────────────────────────
echo "▶ [1/3] Building and pushing Docker image..."

gcloud builds submit \
    --config=cloudbuild.yaml \
    --substitutions="_IMAGE=${IMAGE},_SERVICE=backend" \
    --project="${PROJECT_ID}" \
    .

echo "   ✅ Image pushed: ${IMAGE}"

# ── Step 2: Deploy to Cloud Run ───────────────────────────────────────────────
echo "▶ [2/3] Deploying to Cloud Run..."

    # Configure deployment settings for gcloud run deploy:
    # - --service-account: Backend runs with the dedicated Service Account identity
    # - --allow-unauthenticated: Allow public/unauthenticated requests (cors handles API access control)
    # - --add-cloudsql-instances: Attach Cloud SQL database using Cloud SQL Auth Proxy socket
    # - --set-secrets: Inject JWT secret and DB URL from Secret Manager
    # - --set-env-vars: Standard environment variables including port, environments, log settings
    # - --cpu, --memory, --cpu-throttling: Resource configurations for cost efficiency
    # - --min-instances=1: Keep 1 warm instance active to avoid cold starts
    # - --max-instances=10: Limit maximum scaling for cost limits
    # - --concurrency=80: Maximum concurrent requests per container
    gcloud run deploy "${SERVICE_NAME}" \
        --image="${IMAGE}" \
        --region="${REGION}" \
        --platform=managed \
        --project="${PROJECT_ID}" \
        --service-account="${BACKEND_SA}" \
        --allow-unauthenticated \
        --add-cloudsql-instances="${CLOUDSQL_INSTANCE}" \
        --set-secrets="DATABASE_URL=ecotrace-db-url:latest,JWT_SECRET_KEY=ecotrace-jwt-secret:latest" \
        --set-env-vars="ENVIRONMENT=production,PROJECT_NAME=EcoTrace Carbon Footprint API,JWT_ALGORITHM=HS256,ACCESS_TOKEN_EXPIRE_MINUTES=60,LOG_LEVEL=info,WEB_CONCURRENCY=2,ALLOWED_ORIGINS=${ALLOWED_ORIGINS:-https://ecotrace-frontend-HASH-uc.a.run.app}" \
        --cpu=1 \
        --memory=512Mi \
        --cpu-throttling \
        --min-instances=1 \
        --max-instances=10 \
        --concurrency=80 \
        --ingress=all \
        --timeout=300 \
        --port=8080

echo "   ✅ Backend deployed."

# ── Step 3: Print service URL ─────────────────────────────────────────────────
echo "▶ [3/3] Fetching service URL..."
SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" \
    --region="${REGION}" \
    --project="${PROJECT_ID}" \
    --format="value(status.url)")

echo ""
echo "╔═══════════════════════════════════════════════╗"
echo "║  Backend Live: ${SERVICE_URL}  ║"
echo "╚═══════════════════════════════════════════════╝"
echo ""
echo "   Health check: curl ${SERVICE_URL}/"
echo "   API Docs    : ${SERVICE_URL}/docs"
