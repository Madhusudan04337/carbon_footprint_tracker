from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.repositories.log_repo import log_repository

router = APIRouter(prefix="/analytics", tags=["Insights & Analytics"])

@router.get("/summary")
def get_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    logs = log_repository.get_user_emissions_summary(db, user_id=current_user.id)
    
    total = 0.0
    breakdown = {
        "transport": 0.0,
        "diet": 0.0,
        "energy": 0.0
    }
    
    for log in logs:
        total += log.emissions_co2e
        if log.category in breakdown:
            breakdown[log.category] += log.emissions_co2e
            
    # Round metrics for readability
    total = round(total, 2)
    for cat in breakdown:
        breakdown[cat] = round(breakdown[cat], 2)
        
    # Standard monthly target benchmark: US baseline monthly average is 1333.33 kg
    national_monthly_average = 1333.33
    percent_difference = 0.0
    if national_monthly_average > 0:
        percent_difference = round(((total - national_monthly_average) / national_monthly_average) * 100, 1)

    return {
        "total_emissions_co2e": total,
        "category_breakdown": breakdown,
        "benchmarks": {
            "user_total": total,
            "national_monthly_average": national_monthly_average,
            "percent_difference": percent_difference
        },
        "logs_count": len(logs)
    }
