from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.services.recommendation_service import RecommendationService

router = APIRouter(prefix="/recommendations", tags=["Sustainability Recommendations"])

@router.get("")
def get_recommendations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return RecommendationService.generate_recommendations(db, user_id=current_user.id)
