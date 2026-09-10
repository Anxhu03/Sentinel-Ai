import re
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy.sql import func

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")

from backend.app.auth import (
    create_access_token,
    get_current_user,
    hash_password,
    require_role,
    revoke_token,
    security,
    verify_password,
)
from backend.app.database import get_db
from backend.app.models import User

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication & RBAC"],
)


class LoginRequest(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    identifier: Optional[str] = None
    password: str


class SignupRequest(BaseModel):
    name: str
    email: str
    password: str
    confirm_password: str
    organization: Optional[str] = "Sentinel Corp"
    workspace: Optional[str] = "Production Mesh"


class UserInfo(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str] = None
    organization: Optional[str] = "Sentinel Corp"
    workspace: Optional[str] = "Production Mesh"
    role: str
    is_active: bool


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    organization: Optional[str] = "Sentinel Corp"
    workspace: Optional[str] = "Production Mesh"
    role: str
    user: Optional[UserInfo] = None


class UserProfileResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str] = None
    organization: Optional[str] = "Sentinel Corp"
    workspace: Optional[str] = "Production Mesh"
    role: str
    is_active: bool


class CreateUserRequest(BaseModel):
    username: str
    email: str
    password: str
    role: str = "operator"
    full_name: Optional[str] = None
    organization: Optional[str] = "Sentinel Corp"
    workspace: Optional[str] = "Production Mesh"


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
@router.post("/signup/", response_model=TokenResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
def signup(request: SignupRequest, db: Session = Depends(get_db)):
    """Allow a new user to create a real SaaS account with Name, Email, Password, Confirm Password."""
    name = request.name.strip()
    if len(name) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Name must be at least 2 characters long.",
        )

    if len(request.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long.",
        )

    if request.password != request.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password confirmation does not match.",
        )

    clean_email = request.email.lower().strip()
    if not EMAIL_REGEX.match(clean_email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email format. Please provide a valid email address.",
        )

    existing_user = db.query(User).filter(func.lower(User.email) == clean_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists. Please sign in.",
        )

    # Derive unique username candidate
    email_prefix = clean_email.split("@")[0]
    base_uname = re.sub(r"[^a-zA-Z0-9_]", "", email_prefix) or "operator"
    candidate = base_uname
    suffix = 1
    while db.query(User).filter(func.lower(User.username) == candidate.lower()).first():
        candidate = f"{base_uname}_{suffix}"
        suffix += 1

    hashed = hash_password(request.password)
    new_user = User(
        username=candidate,
        email=clean_email,
        full_name=name,
        hashed_password=hashed,
        organization=request.organization or "Sentinel Corp",
        workspace=request.workspace or "Production Mesh",
        role="operator",
        is_active=True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token(
        data={"sub": new_user.username, "role": new_user.role, "id": new_user.id}
    )
    user_info = UserInfo(
        id=new_user.id,
        username=new_user.username,
        email=new_user.email,
        full_name=new_user.full_name,
        organization=new_user.organization,
        workspace=new_user.workspace,
        role=new_user.role,
        is_active=new_user.is_active,
    )
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=new_user.id,
        username=new_user.username,
        email=new_user.email,
        full_name=new_user.full_name,
        organization=new_user.organization,
        workspace=new_user.workspace,
        role=new_user.role,
        user=user_info,
    )


@router.post("/login", response_model=TokenResponse)
@router.post("/login/", response_model=TokenResponse, include_in_schema=False)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate user with email or username and password, returning JWT token."""
    ident = (request.email or request.username or request.identifier or "").strip()
    if not ident or not request.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email/username and password are required.",
        )

    user = (
        db.query(User)
        .filter(
            (func.lower(User.email) == ident.lower())
            | (func.lower(User.username) == ident.lower())
        )
        .first()
    )

    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled. Please contact your system administrator.",
        )

    token = create_access_token(
        data={"sub": user.username, "role": user.role, "id": user.id}
    )
    user_info = UserInfo(
        id=user.id,
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        organization=user.organization or "Sentinel Corp",
        workspace=user.workspace or "Production Mesh",
        role=user.role,
        is_active=user.is_active,
    )
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        organization=user.organization or "Sentinel Corp",
        workspace=user.workspace or "Production Mesh",
        role=user.role,
        user=user_info,
    )


@router.post("/logout")
@router.post("/logout/", include_in_schema=False)
def logout(credentials: Optional[HTTPAuthorizationCredentials] = Security(security)):
    """Sign out the current session and invalidate JWT access token."""
    if credentials and credentials.credentials:
        revoke_token(credentials.credentials)
    return {"message": "Logged out successfully.", "status": "ok"}


@router.get("/me", response_model=UserProfileResponse)
@router.get("/me/", response_model=UserProfileResponse, include_in_schema=False)
def get_profile(current_user: User = Depends(get_current_user)):
    """Get authenticated user profile."""
    return UserProfileResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        full_name=current_user.full_name,
        organization=current_user.organization or "Sentinel Corp",
        workspace=current_user.workspace or "Production Mesh",
        role=current_user.role,
        is_active=current_user.is_active,
    )


@router.post("/register", response_model=UserProfileResponse, status_code=status.HTTP_201_CREATED)
def register_user(request: CreateUserRequest, db: Session = Depends(get_db)):
    """Register a new user account (programmatic / admin creation)."""
    if db.query(User).filter(func.lower(User.username) == request.username.lower().strip()).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered.",
        )
    if db.query(User).filter(func.lower(User.email) == request.email.lower().strip()).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered.",
        )

    role = request.role.lower() if request.role else "operator"
    if role not in ("admin", "operator", "viewer"):
        role = "operator"

    new_user = User(
        username=request.username.strip(),
        email=request.email.lower().strip(),
        hashed_password=hash_password(request.password),
        full_name=request.full_name,
        organization=request.organization or "Sentinel Corp",
        workspace=request.workspace or "Production Mesh",
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
        full_name=new_user.full_name,
        organization=new_user.organization,
        workspace=new_user.workspace,
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
            "full_name": "Sentinel Administrator",
            "organization": "Sentinel Global Operations",
            "workspace": "Production Mesh",
        },
        {
            "username": "operator",
            "email": "ops@sentinel.ai",
            "password": "sentinel_ops_password_2026",
            "role": "operator",
            "full_name": "SRE Lead Operator",
            "organization": "Sentinel Global Operations",
            "workspace": "Production Mesh",
        },
        {
            "username": "viewer",
            "email": "viewer@sentinel.ai",
            "password": "sentinel_view_password_2026",
            "role": "viewer",
            "full_name": "SecOps Audit Observer",
            "organization": "Sentinel Global Operations",
            "workspace": "Audit Staging",
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
                full_name=item["full_name"],
                organization=item["organization"],
                workspace=item["workspace"],
                is_active=True,
            )
            db.add(new_user)
            created.append(item["username"])
        else:
            # Update missing attributes if needed
            if not existing.full_name:
                existing.full_name = item["full_name"]
            if not existing.organization:
                existing.organization = item["organization"]
            if not existing.workspace:
                existing.workspace = item["workspace"]

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
            full_name=u.full_name,
            organization=u.organization or "Sentinel Corp",
            workspace=u.workspace or "Production Mesh",
            role=u.role,
            is_active=u.is_active,
        )
        for u in users
    ]
