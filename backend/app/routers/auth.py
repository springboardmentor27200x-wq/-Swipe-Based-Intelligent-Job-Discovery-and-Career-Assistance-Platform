from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from authlib.integrations.starlette_client import OAuth

from app.config import settings
from app.models_admin import PlatformSettings
from app.database import get_db
from app.dependencies import get_current_user
from app.models import User, UserRole, AuthProvider
from app.models_admin import PlatformSettings
from app.schemas import UserSignup, UserLogin, UserOut, Token, RefreshRequest, LogoutRequest
from app.security import (
    hash_password,
    verify_password,
    create_access_token,
    generate_refresh_token,
    hash_refresh_token,
)
from app.models_admin import RefreshToken
from datetime import datetime

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# ---- Google OAuth2 client setup ----
oauth = OAuth()
oauth.register(
    name="google",
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)


def _issue_token(user: User, db: Session) -> Token:
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role.value, "ver": user.token_version}
    )
    raw_refresh, refresh_hash, expires_at = generate_refresh_token()
    db.add(RefreshToken(user_id=user.id, token_hash=refresh_hash, expires_at=expires_at))
    db.commit()
    return Token(access_token=access_token, refresh_token=raw_refresh, user=UserOut.model_validate(user))


@router.post("/signup", response_model=Token, status_code=status.HTTP_201_CREATED)
def signup(payload: UserSignup, db: Session = Depends(get_db)):
    # Public signup can only create job_seeker or recruiter accounts.
    # Admin accounts must be created directly in the database / by an existing admin.
    if payload.role == UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin accounts cannot be created through public signup",
        )

    settings_row = db.query(PlatformSettings).first()
    if settings_row and not settings_row.allow_new_signups:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="New signups are currently disabled",
        )

    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists",
        )
    
    print("Password:", payload.password)
    print("Length:", len(payload.password))

    user = User(
        full_name=payload.full_name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=payload.role,
        auth_provider=AuthProvider.local,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return _issue_token(user, db)


@router.post("/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()

    invalid_creds = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect email or password",
    )

    if not user or not user.hashed_password:
        raise invalid_creds
    if not verify_password(payload.password, user.hashed_password):
        raise invalid_creds
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account disabled")

    return _issue_token(user, db)


@router.get("/me", response_model=UserOut)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user


# ---- Google OAuth2 login flow ----
@router.get("/google/login")
async def google_login(request: Request, db: Session = Depends(get_db)):
    settings_row = db.query(PlatformSettings).first()
    if settings_row and not settings_row.allow_google_oauth:
        return RedirectResponse(f"{settings.FRONTEND_URL}/login?error=google_disabled")

    redirect_uri = settings.GOOGLE_REDIRECT_URI
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/google/callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    token = await oauth.google.authorize_access_token(request)
    userinfo = token.get("userinfo")
    if not userinfo or not userinfo.get("email"):
        raise HTTPException(status_code=400, detail="Google authentication failed")

    settings_row = db.query(PlatformSettings).first()
    if settings_row and not settings_row.allow_google_oauth:
        return RedirectResponse(f"{settings.FRONTEND_URL}/login?error=google_disabled")

    email = userinfo["email"]
    full_name = userinfo.get("name", email.split("@")[0])

    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            full_name=full_name,
            email=email,
            hashed_password=None,
            role=UserRole.job_seeker,
            auth_provider=AuthProvider.google,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = _issue_token(user, db)

    # Redirect back to the frontend with both tokens so it can store them.
    return RedirectResponse(
        f"{settings.FRONTEND_URL}/oauth-success?token={token.access_token}&refresh={token.refresh_token}"
    )

@router.post("/refresh", response_model=Token)
def refresh_access_token(payload: RefreshRequest, db: Session = Depends(get_db)):
    token_hash = hash_refresh_token(payload.refresh_token)
    row = db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).first()

    invalid = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    if row is None or row.revoked or row.expires_at < datetime.utcnow():
        raise invalid

    user = db.query(User).filter(User.id == row.user_id).first()
    if user is None or not user.is_active:
        raise invalid

    # Rotate: revoke the used refresh token, issue a brand new pair.
    row.revoked = True
    db.commit()

    return _issue_token(user, db)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(payload: LogoutRequest, db: Session = Depends(get_db)):
    """Revokes one refresh token (this device only)."""
    token_hash = hash_refresh_token(payload.refresh_token)
    row = db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).first()
    if row:
        row.revoked = True
        db.commit()
    return None


@router.post("/logout-all", status_code=status.HTTP_204_NO_CONTENT)
def logout_all_devices(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Bumps token_version (kills every access token instantly) and revokes
    every refresh token this user has ever been issued."""
    current_user.token_version += 1
    db.query(RefreshToken).filter(RefreshToken.user_id == current_user.id).update(
        {"revoked": True}
    )
    db.commit()
    return None
