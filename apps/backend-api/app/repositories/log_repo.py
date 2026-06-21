from typing import List
from sqlalchemy.orm import Session
from datetime import date
from app.repositories.base import BaseRepository
from app.models.log import ActivityLog

class LogRepository(BaseRepository[ActivityLog]):
    def __init__(self):
        super().__init__(ActivityLog)

    def get_by_user(self, db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[ActivityLog]:
        from sqlalchemy.orm import selectinload
        return db.query(ActivityLog).options(selectinload(ActivityLog.user)).filter(
            ActivityLog.user_id == user_id,
            ActivityLog.deleted_at == None
        ).order_by(ActivityLog.date.desc()).offset(skip).limit(limit).all()

    def get_user_emissions_summary(self, db: Session, user_id: int) -> List[ActivityLog]:
        return db.query(ActivityLog).filter(
            ActivityLog.user_id == user_id,
            ActivityLog.deleted_at == None
        ).all()

    def get_emissions_aggregation(self, db: Session, user_id: int):
        from sqlalchemy import func
        return db.query(
            ActivityLog.category,
            func.sum(ActivityLog.emissions_co2e)
        ).filter(
            ActivityLog.user_id == user_id,
            ActivityLog.deleted_at == None
        ).group_by(ActivityLog.category).all()

    def get_user_logs_count(self, db: Session, user_id: int) -> int:
        return db.query(ActivityLog).filter(
            ActivityLog.user_id == user_id,
            ActivityLog.deleted_at == None
        ).count()

log_repository = LogRepository()

