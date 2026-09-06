import os
from dotenv import load_dotenv

load_dotenv()

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base


# =====================================================
# DATABASE CONFIGURATION
# =====================================================

DATABASE_URL = os.getenv("DATABASE_URL")


# Local development fallback
if not DATABASE_URL:
    DATABASE_URL = (
        "postgresql://postgres@localhost:5432/jobmatch_ai"
    )


# Render / PostgreSQL compatibility
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace(
        "postgres://",
        "postgresql://",
        1
    )


# =====================================================
# SQLALCHEMY
# =====================================================

engine = create_engine(
    DATABASE_URL,
    connect_args={"hostaddr": "18.233.142.186"}
)


SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


Base = declarative_base()


# =====================================================
# DATABASE SESSION
# =====================================================

def get_db():

    db = SessionLocal()

    try:

        yield db

    finally:

        db.close()