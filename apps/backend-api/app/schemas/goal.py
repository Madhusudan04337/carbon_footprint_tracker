from pydantic import BaseModel, Field, ConfigDict
from datetime import date
from typing import Optional

class GoalCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=150)
    category: str = Field(..., min_length=1, max_length=50) # transport, diet, energy, overall
    target_reduction_percent: Optional[float] = Field(None, ge=0, le=100)
    target_emissions_limit: Optional[float] = Field(None, ge=0)
    start_date: date
    end_date: date

class GoalResponse(GoalCreate):
    id: int
    user_id: int
    completed: bool

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "title": "Reduce transit footprint",
                "category": "transport",
                "target_reduction_percent": 15.0,
                "target_emissions_limit": 50.0,
                "start_date": "2026-06-01",
                "end_date": "2026-06-30",
                "id": 1,
                "user_id": 1,
                "completed": False
            }
        }
    )

class GoalStatusToggle(BaseModel):
    completed: bool

