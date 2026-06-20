#!/usr/bin/env bash
# =============================================================================
# EcoTrace — Cloud Run Rollback Script
# =============================================================================
# Instantly rolls back a Cloud Run service to a specific revision or the
# previous traffic-serving revision.
#
# Usage:
#   # Rollback backend to previous revision:
#   ./deployment/rollback.sh backend
#
#   # Rollback frontend to a specific revision:
#   ./deployment/rollback.sh frontend ecotrace-frontend-00005-abc
#
#   # List all revisions:
#   ./deployment/rollback.sh list backend
# =============================================================================

set -euo pipefail

PROJECT_ID="${GCP_PROJECT_ID:?Set GCP_PROJECT_ID}"
REGION="${GCP_REGION:-asia-south1}"

SERVICE_TYPE="${1:?Usage: rollback.sh <backend|frontend> [revision-name]}"
REVISION="${2:-}"

case "${SERVICE_TYPE}" in
    backend)  SERVICE_NAME="ecotrace-api" ;;
    frontend) SERVICE_NAME="ecotrace-frontend" ;;
    list)
        TARGET="${2:?Usage: rollback.sh list <backend|frontend>}"
        case "${TARGET}" in
            backend)  SVC="ecotrace-api" ;;
            frontend) SVC="ecotrace-frontend" ;;
        esac
        echo "📋 Revisions for ${SVC}:"
        gcloud run revisions list \
            --service="${SVC}" \
            --region="${REGION}" \
            --project="${PROJECT_ID}" \
            --format="table(name,status.conditions[0].lastTransitionTime,spec.containers[0].image,status.observedGeneration)"
        exit 0
        ;;
    *)
        echo "Error: SERVICE_TYPE must be 'backend', 'frontend', or 'list'"; exit 1 ;;
esac

if [[ -z "${REVISION}" ]]; then
    # Auto-detect: find the revision serving traffic before the current one
    echo "🔍 Auto-detecting previous stable revision for ${SERVICE_NAME}..."
    CURRENT=$(gcloud run services describe "${SERVICE_NAME}" \
        --region="${REGION}" --project="${PROJECT_ID}" \
        --format="value(status.traffic[0].revisionName)")

    REVISION=$(gcloud run revisions list \
        --service="${SERVICE_NAME}" \
        --region="${REGION}" --project="${PROJECT_ID}" \
        --format="value(name)" \
        --filter="name!=${CURRENT}" \
        --sort-by="~metadata.creationTimestamp" \
        --limit=1)

    echo "   Current  : ${CURRENT}"
    echo "   Rollback : ${REVISION}"
fi

echo ""
echo "⚠️  Rolling back ${SERVICE_NAME} → ${REVISION}"
read -p "   Confirm? [y/N] " -n 1 -r
echo
[[ $REPLY =~ ^[Yy]$ ]] || { echo "Cancelled."; exit 0; }

# Send 100% of traffic to the target revision
gcloud run services update-traffic "${SERVICE_NAME}" \
    --region="${REGION}" \
    --project="${PROJECT_ID}" \
    --to-revisions="${REVISION}=100"

echo ""
echo "✅ Rolled back ${SERVICE_NAME} to revision: ${REVISION}"
echo "   Verify: gcloud run services describe ${SERVICE_NAME} --region=${REGION}"
