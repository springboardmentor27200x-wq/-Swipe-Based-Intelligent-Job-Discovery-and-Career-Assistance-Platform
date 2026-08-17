from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime
)

from datetime import datetime

from database import Base


# =========================================================
# USER
# =========================================================

class User(Base):

    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    username = Column(
        String,
        nullable=False
    )

    email = Column(
        String,
        unique=True,
        nullable=False
    )

    password = Column(
        String,
        nullable=False
    )

    role = Column(
        String,
        nullable=False
    )


# =========================================================
# JOB
# =========================================================

class Job(Base):

    __tablename__ = "jobs"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    company = Column(
        String,
        nullable=False
    )

    title = Column(
        String,
        nullable=False
    )

    location = Column(
        String,
        nullable=False
    )

    salary = Column(
        String,
        nullable=False
    )

    experience = Column(
        String,
        nullable=False
    )

    description = Column(
        String,
        nullable=False
    )


# =========================================================
# SWIPE / APPLICATION
# =========================================================

class Swipe(Base):

    __tablename__ = "swipes"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    username = Column(
        String,
        nullable=False
    )

    job_id = Column(
        Integer,
        nullable=False
    )

    action = Column(
        String,
        nullable=False
    )

    status = Column(
        String,
        nullable=False,
        default="Pending"
    )


# =========================================================
# RESUME
# =========================================================

class Resume(Base):

    __tablename__ = "resumes"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    username = Column(
        String,
        nullable=True
    )

    filename = Column(
        String,
        nullable=True
    )

    filepath = Column(
        String,
        nullable=True
    )


# =========================================================
# NOTIFICATION
# =========================================================

class Notification(Base):

    __tablename__ = "notifications"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    username = Column(
        String,
        nullable=False
    )

    title = Column(
        String,
        nullable=False
    )

    message = Column(
        String,
        nullable=False
    )

    is_read = Column(
        Boolean,
        default=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )