import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.auth.schemas import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    UserResponse,
    UserUpdateRequest,
    RoleUpdateRequest,
    ChangePasswordRequest,
)
from app.auth.utils import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_current_active_user,
    require_role,
)

router = APIRouter(prefix="/auth", tags=["auth"])


def _serialize_user(user: User) -> UserResponse:
    """Convert User ORM model to UserResponse, parsing JSON skills."""
    try:
        skills = json.loads(user.skills) if user.skills else []
    except (json.JSONDecodeError, TypeError):
        skills = []
    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        avatar_url=user.avatar_url,
        title=user.title,
        location=user.location,
        bio=user.bio,
        skills=skills,
        experience_years=user.experience_years or 0,
        education=user.education,
        linkedin_url=user.linkedin_url,
        github_url=user.github_url,
        portfolio_url=user.portfolio_url,
        is_active=user.is_active,
        created_at=user.created_at,
    )


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new user and return a token."""
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    allowed_roles = {"job_seeker", "recruiter"}
    if payload.role not in allowed_roles:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Role must be one of: {', '.join(allowed_roles)}")

    user = User(
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=get_password_hash(payload.password),
        role=payload.role,
        skills="[]",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(data={"sub": user.email})
    return TokenResponse(access_token=token, token_type="bearer", user=_serialize_user(user))


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate user and return a token."""
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Account is deactivated")

    token = create_access_token(data={"sub": user.email})
    return TokenResponse(access_token=token, token_type="bearer", user=_serialize_user(user))


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_active_user)):
    """Get the current authenticated user's profile."""
    return _serialize_user(current_user)


@router.put("/me", response_model=UserResponse)
def update_me(
    payload: UserUpdateRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Update the current user's profile."""
    update_data = payload.model_dump(exclude_unset=True)

    if "skills" in update_data and isinstance(update_data["skills"], list):
        update_data["skills"] = json.dumps(update_data["skills"])

    for field, value in update_data.items():
        setattr(current_user, field, value)

    db.commit()
    db.refresh(current_user)
    return _serialize_user(current_user)


@router.put("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Change the current user's password."""
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")
    if len(payload.new_password) < 6:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="New password must be at least 6 characters")

    current_user.hashed_password = get_password_hash(payload.new_password)
    db.commit()
    return {"message": "Password updated successfully"}


@router.get("/users", response_model=List[UserResponse])
def list_users(
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    """Admin: list all users."""
    users = db.query(User).all()
    return [_serialize_user(u) for u in users]


# ---- Admin Routes ----

admin_router = APIRouter(prefix="/api/admin", tags=["admin"])


@admin_router.get("/users", response_model=List[UserResponse])
def admin_list_users(
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    """Admin: list all users."""
    users = db.query(User).all()
    return [_serialize_user(u) for u in users]


@admin_router.put("/users/{user_id}/role", response_model=UserResponse)
def admin_change_role(
    user_id: int,
    payload: RoleUpdateRequest,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    """Admin: change a user's role."""
    allowed_roles = {"job_seeker", "recruiter", "admin"}
    if payload.role not in allowed_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {', '.join(allowed_roles)}")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.role = payload.role
    db.commit()
    db.refresh(user)
    return _serialize_user(user)


@admin_router.delete("/users/{user_id}", status_code=status.HTTP_200_OK)
def admin_deactivate_user(
    user_id: int,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    """Admin: deactivate a user account."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = False
    db.commit()
    return {"message": f"User {user_id} deactivated"}


@admin_router.get("/stats")
def admin_stats(
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    """Admin: platform-wide statistics."""
    from app.models.job import Job
    from app.models.application import Application
    from app.models.swipe import Swipe
    from app.models.company import Company

    total_users = db.query(User).count()
    job_seekers = db.query(User).filter(User.role == "job_seeker").count()
    recruiters = db.query(User).filter(User.role == "recruiter").count()
    total_jobs = db.query(Job).count()
    active_jobs = db.query(Job).filter(Job.is_active == True).count()
    total_applications = db.query(Application).count()
    total_swipes = db.query(Swipe).count()
    total_companies = db.query(Company).count()

    return {
        "total_users": total_users,
        "job_seekers": job_seekers,
        "recruiters": recruiters,
        "total_jobs": total_jobs,
        "active_jobs": active_jobs,
        "total_applications": total_applications,
        "total_swipes": total_swipes,
        "total_companies": total_companies,
    }
