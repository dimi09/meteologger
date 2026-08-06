import os
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse

from app.auth import get_current_user
from app.config import BACKUPS_DIR

router = APIRouter(prefix="/api/backups", tags=["backups"])


@router.get("")
def list_backups(user: str = Depends(get_current_user)):
    items = []
    for name in os.listdir(BACKUPS_DIR):
        p = os.path.join(BACKUPS_DIR, name)
        if os.path.isfile(p):
            st = os.stat(p)
            items.append({
                "name": name,
                "size_bytes": st.st_size,
                "modified": datetime.fromtimestamp(st.st_mtime, tz=timezone.utc).isoformat(),
            })
    items.sort(key=lambda x: x["modified"], reverse=True)
    return {"backups": items}


@router.get("/{name}/download")
def download_backup(name: str, user: str = Depends(get_current_user)):
    safe = os.path.basename(name)
    path = os.path.join(BACKUPS_DIR, safe)
    if not os.path.isfile(path):
        raise HTTPException(status_code=404, detail="Το backup δεν βρέθηκε.")
    return FileResponse(path, filename=safe, media_type="application/octet-stream")
