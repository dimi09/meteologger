import os
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse

from app.auth import get_current_user
from app.config import UPLOADS_DIR

router = APIRouter(prefix="/api/files", tags=["files"])


def _list_dir(directory: str):
    items = []
    for name in os.listdir(directory):
        p = os.path.join(directory, name)
        if os.path.isfile(p):
            st = os.stat(p)
            items.append({
                "name": name,
                "size_bytes": st.st_size,
                "modified": datetime.fromtimestamp(st.st_mtime, tz=timezone.utc).isoformat(),
            })
    items.sort(key=lambda x: x["modified"], reverse=True)
    return items


@router.get("")
def list_files(user: str = Depends(get_current_user)):
    return {"files": _list_dir(UPLOADS_DIR)}


@router.get("/{name}/download")
def download_file(name: str, user: str = Depends(get_current_user)):
    safe = os.path.basename(name)  # προστασία από path traversal
    path = os.path.join(UPLOADS_DIR, safe)
    if not os.path.isfile(path):
        raise HTTPException(status_code=404, detail="Το αρχείο δεν βρέθηκε.")
    return FileResponse(path, filename=safe, media_type="application/octet-stream")
