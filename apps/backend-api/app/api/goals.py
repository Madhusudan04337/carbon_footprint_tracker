from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.goal import GoalCreate, GoalResponse, GoalStatusToggle
from app.repositories.goal_repo import goal_repository
from app.models.goal import Goal

router = APIRouter(prefix="/goals", tags=["Reduction Goals"])

@router.post("", response_model=GoalResponse, status_code=status.HTTP_201_CREATED)
def create_goal(
    goal_in: GoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_goal = Goal(
        user_id=current_user.id,
        title=goal_in.title,
        category=goal_in.category,
        target_reduction_percent=goal_in.target_reduction_percent,
        target_emissions_limit=goal_in.target_emissions_limit,
        start_date=goal_in.start_date,
        end_date=goal_in.end_date,
        completed=False
    )
    return goal_repository.create(db, obj_in=new_goal)

@router.get("", response_model=List[GoalResponse])
def get_goals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return goal_repository.get_by_user(db, user_id=current_user.id)

@router.put("/{goal_id}", response_model=GoalResponse)
def update_goal_status(
    goal_id: int,
    status_in: GoalStatusToggle,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    goal = goal_repository.get(db, id=goal_id)
    if not goal or goal.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Goal not found")
        
    goal.completed = status_in.completed
    db.commit()
    db.refresh(goal)
    return goal
