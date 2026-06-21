from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.repositories.log_repo import log_repository

from cachetools import TTLCache

router = APIRouter(prefix="/analytics", tags=["Insights & Analytics"])

# Cache analytics aggregations for 5 minutes (TTL) to reduce database load
analytics_cache = TTLCache(maxsize=1000, ttl=300)

@router.get("/summary")
def get_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cached_data = analytics_cache.get(current_user.id)
    if cached_data:
        return cached_data
    # Fetch aggregates and counts directly via optimized database methods
    aggregates = log_repository.get_emissions_aggregation(db, user_id=current_user.id)
    logs_count = log_repository.get_user_logs_count(db, user_id=current_user.id)
    
    total = 0.0
    breakdown = {
        "transport": 0.0,
        "diet": 0.0,
        "energy": 0.0,
        "waste": 0.0
    }
    
    for category, emissions_sum in aggregates:
        if category in breakdown:
            breakdown[category] = round(emissions_sum or 0.0, 2)
            total += emissions_sum or 0.0
            
    # Round metrics for readability
    total = round(total, 2)
        
    # Standard monthly target benchmark: US baseline monthly average is 1333.33 kg
    national_monthly_average = 1333.33
    percent_difference = 0.0
    if national_monthly_average > 0:
        percent_difference = round(((total - national_monthly_average) / national_monthly_average) * 100, 1)

    data = {
        "total_emissions_co2e": total,
        "category_breakdown": breakdown,
        "benchmarks": {
            "user_total": total,
            "national_monthly_average": national_monthly_average,
            "percent_difference": percent_difference
        },
        "logs_count": logs_count
    }
    
    analytics_cache[current_user.id] = data
    return data
