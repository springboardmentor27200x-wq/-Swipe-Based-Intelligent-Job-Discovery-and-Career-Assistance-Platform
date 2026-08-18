from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from .database import engine
from .routers import auth, jobs, companies, swipes, recommendations, resumes, messaging, notifications, analytics
from . import models

from sqlalchemy import text

# Automatically create database tables on application startup
models.Base.metadata.create_all(bind=engine)

# Auto-migrate status column on swipes table if missing in existing DB
try:
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE swipes ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'applied';"))
        conn.commit()
except Exception as e:
    print(f"Auto-migration note: {e}")

app = FastAPI(
    title="SwipeX API",
    description="Swipe-Based Intelligent Job Discovery and Career Assistance Platform Backend",
    version="1.0.0"
)

import os

# Get frontend URL from env or use defaults
FRONTEND_URL = os.getenv("FRONTEND_URL")
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001"
]
if FRONTEND_URL:
    allowed_origins.append(FRONTEND_URL)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Custom exception handler for standard HTTPExceptions
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    code = f"HTTP_{exc.status_code}_ERROR"
    if exc.status_code == status.HTTP_401_UNAUTHORIZED:
        code = "UNAUTHORIZED"
    elif exc.status_code == status.HTTP_403_FORBIDDEN:
        code = "FORBIDDEN"
    elif exc.status_code == status.HTTP_404_NOT_FOUND:
        code = "NOT_FOUND"
    elif exc.status_code == status.HTTP_409_CONFLICT:
        code = "DUPLICATE_RESOURCE"
    elif exc.status_code == status.HTTP_400_BAD_REQUEST:
        code = "BAD_REQUEST"

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": code,
                "message": exc.detail
            }
        }
    )

# Custom exception handler for Pydantic input validation errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    error_msgs = []
    for err in exc.errors():
        loc = " -> ".join(str(l) for l in err.get("loc", []))
        msg = err.get("msg")
        error_msgs.append(f"{loc}: {msg}")
    
    message = "; ".join(error_msgs) if error_msgs else "Validation error occurred"
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": message
            }
        }
    )

# Health check endpoint
@app.get("/api/health", status_code=status.HTTP_200_OK)
def health_check():
    return {
        "status": "healthy"
    }

# Include endpoints under /api
app.include_router(auth.router, prefix="/api")
app.include_router(jobs.router, prefix="/api")
app.include_router(companies.router, prefix="/api")
app.include_router(swipes.router, prefix="/api")
app.include_router(recommendations.router, prefix="/api")
app.include_router(resumes.router, prefix="/api")
app.include_router(messaging.router, prefix="/api")
app.include_router(notifications.router)
app.include_router(analytics.router)




