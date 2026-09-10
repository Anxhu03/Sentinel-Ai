from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from backend.app.auth import (
    create_access_token,
    get_current_user,
    hash_password,
    require_role,
    verify_password,
)
from backend.app.database import get_db
from backend.app.models import User

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication & RBAC"],
)


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    username: str
    role: str


class UserProfileResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    is_active: bool


class CreateUserRequest(BaseModel):
    username: str
    email: str
    password: str
    role: str = "operator"


@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate user with username and password, returning JWT token."""
    user = db.query(User).filter(User.username == request.username).first()
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled.",
        )

    token = create_access_token(
        data={"sub": user.username, "role": user.role, "id": user.id}
    )
    return TokenResponse(
        access_token=token,
        user_id=user.id,
        username=user.username,
        role=user.role,
    )


@router.get("/me", response_model=UserProfileResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    """Get authenticated user profile."""
    return UserProfileResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        role=current_user.role,
        is_active=current_user.is_active,
    )


@router.post("/register", response_model=UserProfileResponse, status_code=status.HTTP_201_CREATED)
def register_user(request: CreateUserRequest, db: Session = Depends(get_db)):
    """Register a new user account."""
    if db.query(User).filter(User.username == request.username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered.",
        )
    if db.query(User).filter(User.email == request.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered.",
        )

    role = request.role.lower() if request.role else "operator"
    if role not in ("admin", "operator", "viewer"):
        role = "operator"

    new_user = User(
        username=request.username,
        email=request.email,
        hashed_password=hash_password(request.password),
        role=role,
        is_active=True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return UserProfileResponse(
        id=new_user.id,
        username=new_user.username,
        email=new_user.email,
        role=new_user.role,
        is_active=new_user.is_active,
    )


@router.post("/seed", status_code=status.HTTP_201_CREATED)
def seed_default_users(db: Session = Depends(get_db)):
    """Provision initial administrative and operational user accounts if missing."""
    defaults = [
        {
            "username": "admin",
            "email": "admin@sentinel.ai",
            "password": "sentinel_admin_password_2026",
            "role": "admin",
        },
        {
            "username": "operator",
            "email": "ops@sentinel.ai",
            "password": "sentinel_ops_password_2026",
            "role": "operator",
        },
        {
            "username": "viewer",
            "email": "viewer@sentinel.ai",
            "password": "sentinel_view_password_2026",
            "role": "viewer",
        },
    ]

    created = []
    for item in defaults:
        existing = (
            db.query(User).filter(User.username == item["username"]).first()
        )
        if not existing:
            new_user = User(
                username=item["username"],
                email=item["email"],
                hashed_password=hash_password(item["password"]),
                role=item["role"],
                is_active=True,
            )
            db.add(new_user)
            created.append(item["username"])

    db.commit()
    return {
        "status": "users_seeded",
        "created_users": created,
        "total_users": db.query(User).count(),
    }


@router.get("/users", response_model=List[UserProfileResponse])
def list_users(
    db: Session = Depends(get_db),
    _: User = Depends(require_role(["admin"])),
):
    """List all user accounts (admin only)."""
    users = db.query(User).all()
    return [
        UserProfileResponse(
            id=u.id,
            username=u.username,
            email=u.email,
            role=u.role,
            is_active=u.is_active,
        )
        for u in users
    ]
