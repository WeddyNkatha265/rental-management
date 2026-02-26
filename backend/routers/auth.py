from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from database import get_db
from utils.auth import hash_password, verify_password, create_access_token, get_current_admin
import models
import schemas

router = APIRouter()


@router.post("/register", response_model=schemas.Token, summary="Register first admin")
def register_admin(data: schemas.AdminCreate, db: Session = Depends(get_db)):
    """Register admin. Only works if no admin exists yet (first-time setup)."""
    existing = db.query(models.Admin).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin already exists. Use /login instead."
        )
    if db.query(models.Admin).filter(models.Admin.username == data.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")

    admin = models.Admin(
        username=data.username,
        email=data.email,
        full_name=data.full_name,
        hashed_password=hash_password(data.password),
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)

    token = create_access_token({"sub": admin.username})
    return schemas.Token(
        access_token=token,
        token_type="bearer",
        admin_name=admin.full_name or admin.username
    )


@router.post("/login", response_model=schemas.Token, summary="Login admin")
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    admin = db.query(models.Admin).filter(models.Admin.username == form.username).first()
    if not admin or not verify_password(form.password, admin.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not admin.is_active:
        raise HTTPException(status_code=400, detail="Account disabled")

    token = create_access_token({"sub": admin.username})
    return schemas.Token(
        access_token=token,
        token_type="bearer",
        admin_name=admin.full_name or admin.username
    )


@router.get("/me", summary="Get current admin info")
def get_me(current_admin: models.Admin = Depends(get_current_admin)):
    return {
        "id": current_admin.id,
        "username": current_admin.username,
        "email": current_admin.email,
        "full_name": current_admin.full_name,
    }
