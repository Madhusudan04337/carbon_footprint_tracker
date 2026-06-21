from pydantic import BaseModel, Field, ConfigDict
from datetime import date
from typing import Literal

class LogCreate(BaseModel):
    category: Literal["transport", "diet", "energy", "waste"]
    sub_category: str = Field(..., min_length=1, max_length=100)
    value: float = Field(..., gt=0, description="Raw unit value to calculate (e.g. km, kWh, days)")
    date: date

class LogResponse(LogCreate):
    id: int
    user_id: int
    emissions_co2e: float

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "category": "transport",
                "sub_category": "gasoline_car",
                "value": 150.0,
                "date": "2026-06-20",
                "id": 1,
                "user_id": 1,
                "emissions_co2e": 25.5
            }
        }
    )

