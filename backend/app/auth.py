import os

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta

from .database import get_db
from . import models, schemas


# =============================
# PASSWORD
# =============================

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


# =============================
# JWT SETTINGS
# =============================
# Pulled from the environment in deployment (Render/Docker) and falls
# back to the original local value so nothing breaks when running
# locally without a .env file.

SECRET_KEY = os.getenv("SECRET_KEY", "jobmatch_secret_key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))


security = HTTPBearer()
optional_security = HTTPBearer(auto_error=False)

router = APIRouter()


# =============================
# CREATE JWT
# =============================

def create_access_token(data: dict):

    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    to_encode.update({
        "exp": expire
    })

    return jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


# =============================
# VERIFY JWT
# =============================

def verify_token(
    credentials: HTTPAuthorizationCredentials =
    Depends(security)
):

    token = credentials.credentials

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        return payload

    except Exception:

        raise HTTPException(
            status_code=401,
            detail="Invalid Token"
        )


# =============================
# REGISTER
# =============================

@router.post("/register")
def register(
    user: schemas.UserCreate,
    db: Session = Depends(get_db)
):

    # -------------------------
    # Check existing email
    # -------------------------

    existing_user = db.query(
        models.User
    ).filter(
        models.User.email == user.email
    ).first()


    if existing_user:

        raise HTTPException(
            status_code=400,
            detail="Email already registered. Please use another email."
        )


    # -------------------------
    # Validate role
    # -------------------------

    role = user.role.strip().lower()


    if role not in [
        "jobseeker",
        "job_seeker",
        "recruiter",
        "hr",
        "employer"
    ]:

        raise HTTPException(
            status_code=400,
            detail="Invalid role."
        )


    # Normalize job seeker role

    if role == "job_seeker":

        role = "jobseeker"


    # -------------------------
    # Hash password
    # -------------------------

    hashed_password = pwd_context.hash(
        user.password
    )


    # -------------------------
    # Create user
    # -------------------------

    new_user = models.User(

        name=user.name,

        email=user.email,

        password=hashed_password,

        role=role

    )


    try:

        db.add(new_user)

        db.commit()

        db.refresh(new_user)

    except Exception as e:

        db.rollback()

        print(
            "REGISTRATION DATABASE ERROR:",
            e
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to create account."
        )


    return {

        "message":
            "User Registered Successfully ✅",

        "user": {

            "id":
                new_user.id,

            "name":
                new_user.name,

            "email":
                new_user.email,

            "role":
                new_user.role

        }

    }


# =============================
# LOGIN
# =============================

@router.post("/login")
def login(
    user: schemas.UserLogin,
    db: Session = Depends(get_db)
):

    # -------------------------
    # Find user
    # -------------------------

    db_user = db.query(
        models.User
    ).filter(
        models.User.email == user.email
    ).first()


    if not db_user:

        raise HTTPException(
            status_code=404,
            detail="User not found"
        )


    # -------------------------
    # Check password
    # -------------------------

    if not pwd_context.verify(
        user.password,
        db_user.password
    ):

        raise HTTPException(
            status_code=401,
            detail="Incorrect password"
        )


    # -------------------------
    # Get role
    # -------------------------

    role = (
        db_user.role
        or "jobseeker"
    )


    role = role.strip().lower()


    if role == "job_seeker":

        role = "jobseeker"


    # -------------------------
    # Create token
    # -------------------------

    access_token = create_access_token({

        "sub":
            db_user.email,

        "role":
            role

    })


    # -------------------------
    # Return response
    # -------------------------

    return {

        "access_token":
            access_token,

        "token_type":
            "bearer",

        "message":
            "Login Successful ✅",

        "role":
            role,

        "user": {

            "id":
                db_user.id,

            "name":
                db_user.name,

            "email":
                db_user.email,

            "role":
                role

        }

    }


# =============================
# PROTECTED PROFILE
# =============================

@router.get("/api/profile")
def profile(
    payload: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(
    models.User.email == payload["sub"]
).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return {
    "message": "Welcome to your profile 🎉",
    "user": {
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "resume_text": user.resume_text,
        "resume_filename": user.resume_filename,
        "resume_path": user.resume_path
    }
}


# =============================
# CURRENT USER (Milestone 4)
# =============================
# The existing verify_token() only returns the raw JWT payload
# (email + role). The new applications / saved-jobs / notifications /
# analytics routers need the actual User row, so this resolves it once
# and can be reused as a dependency anywhere.

def get_current_user(
    payload: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):

    email = payload.get("sub")

    user = db.query(models.User).filter(
        models.User.email == email
    ).first()

    if not user:

        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    return user


def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials = Depends(optional_security),
    db: Session = Depends(get_db)
):
    """Same as get_current_user but never raises — returns None when
    there's no token, or when the token is missing/expired. Used by
    resume upload / ATS check so those keep working for a signed-out
    visitor, while personalizing + logging history for a logged-in one.
    """

    if not credentials:
        return None

    try:
        payload = jwt.decode(
            credentials.credentials,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )
    except Exception:
        return None

    return db.query(models.User).filter(
        models.User.email == payload.get("sub")
    ).first()