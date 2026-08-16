import uuid
from sqlalchemy import Column, Boolean, Integer, DateTime, String
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime

from app.database import Base


class PlatformSettings(Base):
    """Singleton row (always id=SETTINGS_ID). Admin-configurable platform settings."""
    __tablename__ = "platform_settings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    maintenance_mode = Column(Boolean, default=False, nullable=False)
    allow_new_signups = Column(Boolean, default=True, nullable=False)
    allow_google_oauth = Column(Boolean, default=True, nullable=False)
    max_resume_versions = Column(Integer, default=5, nullable=False)
    daily_swipe_limit = Column(Integer, default=100, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    token_hash = Column(String, nullable=False, unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
    revoked = Column(Boolean, default=False, nullable=False)