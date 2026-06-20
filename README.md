# EcoTrace: Carbon Footprint Awareness Platform

Welcome to the EcoTrace Monorepo! This platform helps individuals understand, track, and reduce their carbon footprint through simple daily actions and personalized analytics.

## Project Structure

This project uses npm workspaces to manage frontend applications, microservices, and shared calculation libraries in a single place.

*   `apps/frontend/`: Next.js-based web interface showing interactive tracking dashboards and goals.
*   `apps/backend-tracker/`: Express API for processing, computing, and saving individual activity logs.
*   `apps/backend-ml/`: Python FastAPI service generating personalized, AI-driven recommendations.
*   `packages/formulas/`: Shared database of carbon conversion factors (US eGRID, DEFRA) and carbon footprint calculator functions.
*   `packages/config/`: Configuration rules for testing, typescript, and linting.
*   `packages/ui-kit/`: Reusable, accessible UI components.

## Getting Started

### Prerequisites

*   **Node.js**: `v18+` or `v20+`
*   **Python**: `v3.9+` (for ML service)
*   **Docker**: For running containerized local databases (PostgreSQL, MongoDB, Redis)

### Installation

To install all Node-based project dependencies:

```bash
npm install
```

### Running Locally

To run the tracker API and frontend in parallel:

```bash
# Start backend tracker
npm run dev:tracker

# Start web frontend
npm run dev:frontend
```

For the machine learning recommendation engine:

```bash
cd apps/backend-ml
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Related Documents
*   **SRS & Architecture Reference**: [carbon_footprint_srs.md](file:///home/pirate/.gemini/antigravity-cli/brain/449a76d6-990c-42d6-bfbe-40702ec88c55/carbon_footprint_srs.md)
