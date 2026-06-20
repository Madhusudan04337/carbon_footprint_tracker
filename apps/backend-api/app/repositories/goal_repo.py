from typing import List
from sqlalchemy.orm import Session
from app.repositories.base import BaseRepository
from app.models.goal import Goal

class GoalRepository(BaseRepository[Goal]):
    def __init__(self):
        super().__init__(Goal)

    def get_by_user(self, db: Session, user_id: int) -> List[Goal]:
        return db.query(Goal).filter(
            Goal.user_id == user_id,
            Goal.deleted_at == None
        ).all()

goal_repository = GoalRepository()
