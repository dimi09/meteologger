import os

# --- Storage (εκτός docker μέσω bind mount) ---
STORAGE_ROOT = os.getenv("STORAGE_ROOT", os.path.join(os.getcwd(), "storage"))
UPLOADS_DIR = os.path.join(STORAGE_ROOT, "uploads")
IMPORTS_DIR = os.path.join(STORAGE_ROOT, "imports")
EXPORTS_DIR = os.path.join(STORAGE_ROOT, "exports")
BACKUPS_DIR = os.path.join(STORAGE_ROOT, "backups")
for _d in (UPLOADS_DIR, IMPORTS_DIR, EXPORTS_DIR, BACKUPS_DIR):
    os.makedirs(_d, exist_ok=True)

# --- Database ---
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://admin:root@db:5432/measurelog")

# --- Auth ---
SECRET_KEY = os.getenv("SECRET_KEY", "change-me")
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "720"))

# --- CORS ---
CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "*").split(",") if o.strip()]
