from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import CORS_ORIGINS
from app.database import Base, engine
from app.routes import auth, imports, files, backups, summary

# Δημιουργία πινάκων
Base.metadata.create_all(bind=engine)

app = FastAPI(title="MeteoLogger API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(imports.router)
app.include_router(files.router)
app.include_router(backups.router)
app.include_router(summary.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
