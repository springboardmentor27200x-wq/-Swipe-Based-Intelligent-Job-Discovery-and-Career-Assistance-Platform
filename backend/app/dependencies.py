from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, UserRole
from app.security import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    user_id = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    try:
        import uuid
        user_id_val = uuid.UUID(str(user_id))
    except (ValueError, TypeError):
        user_id_val = user_id

    user = db.query(User).filter(User.id == user_id_val).first()
    if user is None or not user.is_active:
        raise credentials_exception

    if payload.get("ver") != user.token_version:
        raise credentials_exception

    if user.role != UserRole.admin:
        from app.models_admin import PlatformSettings
        settings_row = db.query(PlatformSettings).first()
        if settings_row and settings_row.maintenance_mode:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Platform is under maintenance. Please try again later.",
            )
    return user


def require_role(*allowed_roles: UserRole):
    """Dependency factory for role-based access control.
    Usage: Depends(require_role(UserRole.admin))
    """

    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action",
            )
        return current_user

    return role_checker
