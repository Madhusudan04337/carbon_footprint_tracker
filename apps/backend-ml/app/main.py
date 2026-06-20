from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Any
from app.algorithms.recommender import get_recommendations

app = FastAPI(
    title="EcoTrace ML Recommendation Engine",
    description="Microservice providing personalized sustainability recommendations based on carbon footprints.",
    version="1.0.0"
)

# Enable CORS for frontend and core tracker service interaction
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class EmissionsProfileRequest(BaseModel):
    emissions: Dict[str, float]

@app.post("/api/recommendations", response_model=List[Dict[str, Any]])
def recommend(profile: EmissionsProfileRequest):
    try:
        results = get_recommendations(profile.emissions)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "EcoTrace ML Recommender Engine",
        "endpoints": ["POST /api/recommendations"]
    }
