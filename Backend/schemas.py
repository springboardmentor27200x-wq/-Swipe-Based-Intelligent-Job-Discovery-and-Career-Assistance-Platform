from pydantic import BaseModel, EmailStr


# =========================================================
# USER REGISTRATION
# =========================================================

class UserCreate(BaseModel):

    username: str
    email: EmailStr
    password: str
    role: str


# =========================================================
# USER LOGIN
# =========================================================

class UserLogin(BaseModel):

    email: EmailStr
    password: str


# =========================================================
# USER RESPONSE
# =========================================================

class UserResponse(BaseModel):

    id: int
    username: str
    email: EmailStr
    role: str

    class Config:
        from_attributes = True


# =========================================================
# JOB CREATE
# =========================================================

class JobCreate(BaseModel):

    company: str
    title: str
    location: str
    salary: str
    experience: str
    description: str


# =========================================================
# JOB RESPONSE
# =========================================================

class JobResponse(BaseModel):

    id: int
    company: str
    title: str
    location: str
    salary: str
    experience: str
    description: str

    applicant_count: int = 0
    competition: str = "Low"
    early_applicant: bool = True
    recently_posted: bool = True

    class Config:
        from_attributes = True


# =========================================================
# SWIPE CREATE
# =========================================================

class SwipeCreate(BaseModel):

    username: str
    job_id: int
    action: str


# =========================================================
# SWIPE RESPONSE
# =========================================================

class SwipeResponse(BaseModel):

    id: int
    username: str
    job_id: int
    action: str
    status: str

    class Config:
        from_attributes = True


# =========================================================
# RESUME RESPONSE
# =========================================================

class ResumeResponse(BaseModel):

    id: int
    username: str
    filename: str
    filepath: str

    class Config:
        from_attributes = True