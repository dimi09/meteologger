import os

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.config import UPLOADS_DIR
from app.database import get_db
from app.models import WeatherData

router = APIRouter(prefix="/api/summary", tags=["summary"])


@router.get("")
def summary(db: Session = Depends(get_db), user: str = Depends(get_current_user)):
    total = db.query(func.count(WeatherData.id)).scalar() or 0
    tmin = db.query(func.min(WeatherData.timestamp)).scalar()
    tmax = db.query(func.max(WeatherData.timestamp)).scalar()

    files = [f for f in os.listdir(UPLOADS_DIR) if os.path.isfile(os.path.join(UPLOADS_DIR, f))]
    last_file = None
    if files:
        files.sort(key=lambda f: os.path.getmtime(os.path.join(UPLOADS_DIR, f)), reverse=True)
        last_file = files[0]

    return {
        "total_records": total,
        "range_start": tmin.isoformat() if tmin else None,
        "range_end": tmax.isoformat() if tmax else None,
        "files_count": len(files),
        "last_file": last_file,
    }
