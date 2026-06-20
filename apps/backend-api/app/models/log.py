from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Date
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    category = Column(String, nullable=False)     # transport, diet, energy
    sub_category = Column(String, nullable=False) # e.g. gasoline_car, vegan, clean_mix
    value = Column(Float, nullable=False)
    emissions_co2e = Column(Float, nullable=False) # calculated value
    date = Column(Date, nullable=False)
    
    # Audit & Soft-Delete Fields
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", back_populates="logs")
