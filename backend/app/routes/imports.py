import os
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.config import UPLOADS_DIR
from app.database import get_db
from app.services.parsing import parse_dataframe, insert_measurements

router = APIRouter(prefix="/api/import", tags=["import"])


def _save_bytes(content: bytes, original_name: str, ext: str) -> str:
    ts = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S")
    uid = uuid.uuid4().hex[:8]
    stem = os.path.splitext(os.path.basename(original_name))[0]
    name = f"{ts}_{uid}_{stem}{ext}"
    path = os.path.join(UPLOADS_DIR, name)
    with open(path, "wb") as f:
        f.write(content)
    return name, path


@router.post("/excel")
async def import_excel(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: str = Depends(get_current_user),
):
    if not (file.filename or "").lower().endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="Υποστηρίζονται μόνο .xlsx αρχεία σε αυτό το tab.")

    content = await file.read()
    stored_name, path = _save_bytes(content, file.filename, ".xlsx")

    try:
        df = parse_dataframe(path, ".xlsx")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Σφάλμα ανάγνωσης αρχείου: {e}")

    inserted = insert_measurements(df, db)
    return {
        "message": "Η εισαγωγή ολοκληρώθηκε.",
        "stored_file": stored_name,
        "rows_inserted": inserted,
    }


@router.post("/csv")
async def import_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: str = Depends(get_current_user),
):
    if not (file.filename or "").lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Υποστηρίζονται μόνο .csv αρχεία σε αυτό το tab.")

    content = await file.read()
    # προσωρινή αποθήκευση για parsing
    tmp_name, tmp_path = _save_bytes(content, file.filename, ".csv")

    try:
        df = parse_dataframe(tmp_path, ".csv")
    except Exception as e:
        os.path.exists(tmp_path) and os.remove(tmp_path)
        raise HTTPException(status_code=400, detail=f"Σφάλμα ανάγνωσης αρχείου: {e}")

    # Το CSV αποθηκεύεται ως .xlsx (καθαρισμένο) στον ίδιο φάκελο για ιστορικό
    xlsx_name = tmp_name[:-4] + ".xlsx"
    xlsx_path = os.path.join(UPLOADS_DIR, xlsx_name)
    df.to_excel(xlsx_path, index=False)
    os.remove(tmp_path)  # κρατάμε μόνο το xlsx

    inserted = insert_measurements(df, db)
    return {
        "message": "Η εισαγωγή CSV ολοκληρώθηκε (αποθηκεύτηκε ως Excel).",
        "stored_file": xlsx_name,
        "rows_inserted": inserted,
    }
