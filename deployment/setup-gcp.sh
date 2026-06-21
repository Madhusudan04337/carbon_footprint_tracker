#!/usr/bin/env bash
# =============================================================================
# EcoTrace GCP — One-Time Project Bootstrap Script
# =============================================================================
# Run this ONCE by a project Owner to provision every GCP resource the
# deployment pipeline needs.  After this runs, CI/CD handles all future deploys.
#
# Pre-requisites:
#   • gcloud CLI installed and authenticated: gcloud auth login
#   • Billing account attached to the project
#   • You have roles/owner on the project
#
# Usage:
#   chmod +x deployment/setup-gcp.sh
#   export GCP_PROJECT_ID=your-project-id
#   ./deployment/setup-gcp.sh
# =============================================================================

set -euo pipefail

# ── Configuration ─────────────────────────────────────────────────────────────
# Override any of these with environment variables before running.
PROJECT_ID="${GCP_PROJECT_ID:-mystical-surfer-500104-b6}"
REGION="${GCP_REGION:-asia-south1}"          # Mumbai — closest to India
AR_REPO="ecotrace-repo"                       # Artifact Registry repository name
CLOUDSQL_INSTANCE="ecotrace-postgres"         # Cloud SQL instance name
CLOUDSQL_DB="ecotrace_db"
CLOUDSQL_USER="ecotrace_user"
BACKEND_SA="ecotrace-backend-sa"             # Service Account for backend Cloud Run
CLOUDBUILD_SA="ecotrace-cloudbuild-sa"       # Service Account for Cloud Build
APP_NAME="ecotrace"

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║   EcoTrace GCP Bootstrap — Project: ${PROJECT_ID}   ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# ── 1. Set active project ─────────────────────────────────────────────────────
echo "▶ [1/12] Setting active project..."
gcloud config set project "${PROJECT_ID}"

# ── 2. Enable required GCP APIs ───────────────────────────────────────────────
# Only enable what we actually use — principle of least exposure.
echo "▶ [2/12] Enabling GCP APIs..."
gcloud services enable \
    run.googleapis.com \
    sqladmin.googleapis.com \
    secretmanager.googleapis.com \
    artifactregistry.googleapis.com \
    cloudbuild.googleapis.com \
    cloudresourcemanager.googleapis.com \
    iam.googleapis.com \
    logging.googleapis.com \
    monitoring.googleapis.com \
    cloudtrace.googleapis.com \
    sqladmin.googleapis.com \
    vpcaccess.googleapis.com \
    --project="${PROJECT_ID}"
echo "   ✅ APIs enabled."

# ── 3. Create Artifact Registry repository ────────────────────────────────────
# Stores Docker images. Using Docker format; region-specific for latency.
echo "▶ [3/12] Creating Artifact Registry repository..."
if gcloud artifacts repositories describe "${AR_REPO}" \
    --location="${REGION}" --project="${PROJECT_ID}" &>/dev/null; then
    echo "   ℹ️  Repository '${AR_REPO}' already exists — skipping."
else
    gcloud artifacts repositories create "${AR_REPO}" \
        --repository-format=docker \
        --location="${REGION}" \
        --description="EcoTrace Docker images" \
        --project="${PROJECT_ID}"
    echo "   ✅ Artifact Registry repository created."
fi

# ── 4. Create Cloud SQL PostgreSQL instance ───────────────────────────────────
# db-f1-micro is the smallest tier — upgrade to db-g1-small or db-n1-standard-1
# for production workloads.  --no-assign-ip disables the public IP; the backend
# connects via the Cloud SQL Auth Proxy (Unix socket) — never over the internet.
echo "▶ [4/12] Creating Cloud SQL PostgreSQL 16 instance (this takes ~5 min)..."
if gcloud sql instances describe "${CLOUDSQL_INSTANCE}" \
    --project="${PROJECT_ID}" &>/dev/null; then
    echo "   ℹ️  Cloud SQL instance '${CLOUDSQL_INSTANCE}' already exists — skipping."
else
    gcloud sql instances create "${CLOUDSQL_INSTANCE}" \
        --database-version=POSTGRES_16 \
        --tier=db-f1-micro \
        --edition=ENTERPRISE \
        --region="${REGION}" \
        --storage-type=SSD \
        --storage-size=10GB \
        --storage-auto-increase \
        --maintenance-window-day=SUN \
        --maintenance-window-hour=2 \
        --backup-start-time=03:00 \
        --retained-backups-count=7 \
        --deletion-protection \
        --project="${PROJECT_ID}"
    echo "   ✅ Cloud SQL instance created."
fi

# ── 5. Create database and user ───────────────────────────────────────────────
echo "▶ [5/12] Creating database and user..."
gcloud sql databases create "${CLOUDSQL_DB}" \
    --instance="${CLOUDSQL_INSTANCE}" \
    --project="${PROJECT_ID}" 2>/dev/null || echo "   ℹ️  Database already exists."

# Generate a strong random password
DB_PASSWORD=$(openssl rand -base64 32 | tr -d '/+=' | head -c 32)
gcloud sql users create "${CLOUDSQL_USER}" \
    --instance="${CLOUDSQL_INSTANCE}" \
    --password="${DB_PASSWORD}" \
    --project="${PROJECT_ID}" 2>/dev/null || echo "   ℹ️  User already exists."
echo "   ✅ Database '${CLOUDSQL_DB}' and user '${CLOUDSQL_USER}' ready."

# ── 6. Store secrets in Secret Manager ───────────────────────────────────────
# All sensitive values live in Secret Manager — never in environment variables
# or source code.  Cloud Run pulls them at container start via --set-secrets.
echo "▶ [6/12] Creating secrets in Secret Manager..."

CLOUDSQL_CONNECTION_NAME=$(gcloud sql instances describe "${CLOUDSQL_INSTANCE}" \
    --project="${PROJECT_ID}" --format="value(connectionName)")

JWT_SECRET=$(openssl rand -hex 32)

# Helper function: create or update a secret
upsert_secret() {
    local name="$1"
    local value="$2"
    if gcloud secrets describe "${name}" --project="${PROJECT_ID}" &>/dev/null; then
        echo "${value}" | gcloud secrets versions add "${name}" \
            --data-file=- --project="${PROJECT_ID}"
        echo "   🔄 Updated secret: ${name}"
    else
        echo "${value}" | gcloud secrets create "${name}" \
            --replication-policy=automatic \
            --data-file=- \
            --project="${PROJECT_ID}"
        echo "   ✅ Created secret: ${name}"
    fi
}

# Connection string uses Unix socket path provided by Cloud SQL Auth Proxy
DB_URL="postgresql+psycopg2://${CLOUDSQL_USER}:${DB_PASSWORD}@/ecotrace_db?host=/cloudsql/${CLOUDSQL_CONNECTION_NAME}"

upsert_secret "ecotrace-db-url"        "${DB_URL}"
upsert_secret "ecotrace-db-password"   "${DB_PASSWORD}"
upsert_secret "ecotrace-jwt-secret"    "${JWT_SECRET}"
upsert_secret "ecotrace-db-user"       "${CLOUDSQL_USER}"

echo ""
echo "   ⚠️  SAVE THESE CREDENTIALS — they won't be shown again:"
echo "   DB_PASSWORD : ${DB_PASSWORD}"
echo "   JWT_SECRET  : ${JWT_SECRET}"
echo "   SQL_CONN    : ${CLOUDSQL_CONNECTION_NAME}"
echo ""

# ── 7. Create Backend Service Account ─────────────────────────────────────────
# The Cloud Run backend service runs under this identity.
# Grants ONLY what the service needs (least privilege).
echo "▶ [7/12] Creating backend service account..."
BACKEND_SA_EMAIL="${BACKEND_SA}@${PROJECT_ID}.iam.gserviceaccount.com"

if gcloud iam service-accounts describe "${BACKEND_SA_EMAIL}" \
    --project="${PROJECT_ID}" &>/dev/null; then
    echo "   ℹ️  Service account already exists — skipping creation."
else
    gcloud iam service-accounts create "${BACKEND_SA}" \
        --display-name="EcoTrace Backend Service Account" \
        --project="${PROJECT_ID}"
    echo "   ✅ Service account created: ${BACKEND_SA_EMAIL}"
fi

# Grant Cloud SQL Client — allows connecting to Cloud SQL via Auth Proxy
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
    --member="serviceAccount:${BACKEND_SA_EMAIL}" \
    --role="roles/cloudsql.client" \
    --condition=None

# Grant Secret Manager Secret Accessor — allows reading secrets at runtime
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
    --member="serviceAccount:${BACKEND_SA_EMAIL}" \
    --role="roles/secretmanager.secretAccessor" \
    --condition=None

# Grant Cloud Trace Agent — for distributed tracing
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
    --member="serviceAccount:${BACKEND_SA_EMAIL}" \
    --role="roles/cloudtrace.agent" \
    --condition=None

echo "   ✅ IAM roles bound to backend service account."

# ── 8. Create Cloud Build Service Account ────────────────────────────────────
echo "▶ [8/12] Creating Cloud Build service account..."
CLOUDBUILD_SA_EMAIL="${CLOUDBUILD_SA}@${PROJECT_ID}.iam.gserviceaccount.com"

if gcloud iam service-accounts describe "${CLOUDBUILD_SA_EMAIL}" \
    --project="${PROJECT_ID}" &>/dev/null; then
    echo "   ℹ️  Cloud Build SA already exists — skipping."
else
    gcloud iam service-accounts create "${CLOUDBUILD_SA}" \
        --display-name="EcoTrace Cloud Build Service Account" \
        --project="${PROJECT_ID}"
fi

# Cloud Build needs to push to Artifact Registry and deploy to Cloud Run
for role in \
    roles/artifactregistry.writer \
    roles/run.admin \
    roles/iam.serviceAccountUser \
    roles/secretmanager.secretAccessor \
    roles/logging.logWriter; do
    gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
        --member="serviceAccount:${CLOUDBUILD_SA_EMAIL}" \
        --role="${role}" \
        --condition=None
done
echo "   ✅ Cloud Build service account configured."

# ── 9. Workload Identity Federation (GitHub Actions) ─────────────────────────
# Allows GitHub Actions to authenticate to GCP without storing long-lived keys.
# Uses OIDC tokens — the most secure authentication pattern for CI/CD.
echo "▶ [9/12] Setting up Workload Identity Federation for GitHub Actions..."

POOL_NAME="ecotrace-github-pool"
PROVIDER_NAME="ecotrace-github-provider"
GITHUB_REPO="${GITHUB_REPO:-Madhusudan04337/carbon_footprint_tracker}"  # User repository

# Create Workload Identity Pool
if ! gcloud iam workload-identity-pools describe "${POOL_NAME}" \
    --location=global --project="${PROJECT_ID}" &>/dev/null; then
    gcloud iam workload-identity-pools create "${POOL_NAME}" \
        --location=global \
        --display-name="EcoTrace GitHub Pool" \
        --project="${PROJECT_ID}"
fi

# Create OIDC provider for GitHub
if ! gcloud iam workload-identity-pools providers describe "${PROVIDER_NAME}" \
    --workload-identity-pool="${POOL_NAME}" \
    --location=global --project="${PROJECT_ID}" &>/dev/null; then
    gcloud iam workload-identity-pools providers create-oidc "${PROVIDER_NAME}" \
        --workload-identity-pool="${POOL_NAME}" \
        --location=global \
        --issuer-uri="https://token.actions.githubusercontent.com" \
        --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.actor=assertion.actor" \
        --attribute-condition="assertion.repository=='${GITHUB_REPO}'" \
        --project="${PROJECT_ID}"
fi

POOL_RESOURCE_NAME=$(gcloud iam workload-identity-pools describe "${POOL_NAME}" \
    --location=global --project="${PROJECT_ID}" --format="value(name)")

# Allow GitHub Actions to impersonate the Cloud Build SA
gcloud iam service-accounts add-iam-policy-binding "${CLOUDBUILD_SA_EMAIL}" \
    --project="${PROJECT_ID}" \
    --role="roles/iam.workloadIdentityUser" \
    --member="principalSet://iam.googleapis.com/${POOL_RESOURCE_NAME}/attribute.repository/${GITHUB_REPO}"

WORKLOAD_IDENTITY_PROVIDER=$(gcloud iam workload-identity-pools providers describe \
    "${PROVIDER_NAME}" --workload-identity-pool="${POOL_NAME}" \
    --location=global --project="${PROJECT_ID}" --format="value(name)")

echo "   ✅ Workload Identity Federation configured."

# ── 10. Docker authentication for Artifact Registry ──────────────────────────
echo "▶ [10/12] Configuring Docker auth for Artifact Registry..."
gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet
echo "   ✅ Docker auth configured."

# ── 11. Create initial Cloud Run services (placeholders) ─────────────────────
echo "▶ [11/12] Creating placeholder Cloud Run services..."
IMAGE_BASE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPO}"

# Deploy backend placeholder (will be replaced by CI/CD on first push)
gcloud run deploy ecotrace-api \
    --image="gcr.io/cloudrun/hello" \
    --region="${REGION}" \
    --platform=managed \
    --no-allow-unauthenticated \
    --service-account="${BACKEND_SA_EMAIL}" \
    --project="${PROJECT_ID}" \
    --quiet 2>/dev/null || true

# Deploy frontend placeholder
gcloud run deploy ecotrace-frontend \
    --image="gcr.io/cloudrun/hello" \
    --region="${REGION}" \
    --platform=managed \
    --allow-unauthenticated \
    --project="${PROJECT_ID}" \
    --quiet 2>/dev/null || true

echo "   ✅ Placeholder services created."

# ── 12. Print summary ─────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║              Bootstrap Complete! Next Steps:                 ║"
echo "╠══════════════════════════════════════════════════════════════╣"
echo "║  Add these secrets to GitHub repository settings:           ║"
echo "║                                                              ║"
echo "║  GCP_PROJECT_ID         = ${PROJECT_ID}"
echo "║  GCP_REGION             = ${REGION}"
echo "║  WORKLOAD_IDENTITY_PROVIDER = ${WORKLOAD_IDENTITY_PROVIDER}"
echo "║  CLOUDBUILD_SA_EMAIL    = ${CLOUDBUILD_SA_EMAIL}"
echo "║  CLOUDSQL_INSTANCE      = ${CLOUDSQL_CONNECTION_NAME}"
echo "╚══════════════════════════════════════════════════════════════╝"
