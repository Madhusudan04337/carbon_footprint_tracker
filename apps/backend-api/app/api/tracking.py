from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.log import LogCreate, LogResponse
from app.services.tracking_service import TrackingService

router = APIRouter(prefix="/logs", tags=["Activity Tracking"])

@router.post("", response_model=LogResponse, status_code=status.HTTP_201_CREATED)
def log_activity(
    log_in: LogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return TrackingService.log_activity(db, user_id=current_user.id, log_in=log_in)

@router.get("", response_model=List[LogResponse])
def get_activities(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return TrackingService.get_user_logs(db, user_id=current_user.id, skip=skip, limit=limit)

import io
import csv
from fastapi.responses import StreamingResponse

@router.get("/export", response_class=StreamingResponse)
def export_logs_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    logs = TrackingService.get_user_logs(db, user_id=current_user.id, skip=0, limit=10000)
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Date", "Category", "Sub Category", "Value", "Emissions (kg CO2e)"])
    
    for log in logs:
        writer.writerow([log.date, log.category, log.sub_category, log.value, log.emissions_co2e])
        
    output.seek(0)
    
    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=ecotrace_logs.csv"}
    )
