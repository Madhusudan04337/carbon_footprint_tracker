from sqlalchemy.orm import Session
from datetime import date
from app.repositories.log_repo import log_repository
from app.models.log import ActivityLog
from app.schemas.log import LogCreate

# Carbon factors mapping matching EcoTrace guidelines
CARBON_FACTORS = {
    "transport": {
        "gasoline_car": 0.170,
        "diesel_car": 0.171,
        "hybrid_car": 0.109,
        "electric_car": 0.047,
        "bus": 0.096,
        "train": 0.035,
        "flight_short": 0.245,
        "flight_long": 0.147,
    },
    "diet": {
        "vegan": 2.9,
        "vegetarian": 3.8,
        "pescatarian": 4.6,
        "low_meat": 5.6,
        "high_meat": 7.2,
    },
    "energy": {
        "us_average": 0.371,
        "clean_mix": 0.050,
        "coal_heavy": 0.850,
    }
}

class TrackingService:
    @staticmethod
    def calculate_emissions(category: str, sub_category: str, value: float) -> float:
        category_factors = CARBON_FACTORS.get(category, {})
        # Fallbacks if subcategory factor is missing
        factor = category_factors.get(sub_category, 0.1) 
        
        calculated = value * factor
        return round(calculated, 2)

    @staticmethod
    def log_activity(db: Session, user_id: int, log_in: LogCreate) -> ActivityLog:
        emissions = TrackingService.calculate_emissions(
            log_in.category,
            log_in.sub_category,
            log_in.value
        )
        
        new_log = ActivityLog(
            user_id=user_id,
            category=log_in.category,
            sub_category=log_in.sub_category,
            value=log_in.value,
            emissions_co2e=emissions,
            date=log_in.date
        )
        
        return log_repository.create(db, obj_in=new_log)
        
    @staticmethod
    def get_user_logs(db: Session, user_id: int, skip: int = 0, limit: int = 100):
        return log_repository.get_by_user(db, user_id=user_id, skip=skip, limit=limit)
