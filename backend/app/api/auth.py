from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
)

router = APIRouter()


@router.post("/register")
def register(
    user_data: UserCreate,
    db: Session = Depends(get_db),
):
    user = User(
        name=user_data.name,
        email=user_data.email,
        password_hash=hash_password(user_data.password),
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "id": str(user.id),
        "name": user.name,
        "email": user.email,
    }


@router.post("/login")
def login(
    user_data: UserLogin,
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.email == user_data.email)
        .first()
    )

    if not user:
        return {
            "message": "Invalid email or password"
        }

    if not verify_password(
        user_data.password,
        user.password_hash,
    ):
        return {
            "message": "Invalid email or password"
        }

    access_token = create_access_token(str(user.id))

    return {
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": str(user.id),
        "name": user.name,
        "email": user.email,
    }

@router.get("/me")
def get_me(
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        return {
            "message": "User not found"
        }

    return {
        "id": str(user.id),
        "name": user.name,
        "email": user.email,
    }