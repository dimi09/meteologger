from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from app.auth import authenticate, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login")
def login(form: OAuth2PasswordRequestForm = Depends()):
    if not authenticate(form.username, form.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Λάθος όνομα χρήστη ή κωδικός.",
        )
    token = create_access_token(form.username)
    return {"access_token": token, "token_type": "bearer", "username": form.username}


@router.get("/me")
def me(user: str = Depends(get_current_user)):
    return {"username": user}
