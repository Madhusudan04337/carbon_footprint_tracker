from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional

class UserBase(BaseModel):
    email: EmailStr
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    country: str = Field(..., min_length=1, max_length=100)
    postal_code: str = Field(..., min_length=1, max_length=20)

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=100)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class UserResponse(UserBase):
    id: int
    total_points: int

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "email": "eco@example.com",
                "first_name": "Jane",
                "last_name": "Doe",
                "country": "US",
                "postal_code": "90210",
                "id": 1,
                "total_points": 120
            }
        }
    )

