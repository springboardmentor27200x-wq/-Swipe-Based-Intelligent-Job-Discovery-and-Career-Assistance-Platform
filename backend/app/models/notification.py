from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from app.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(512), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), nullable=False)  # match, application, alert, system
    is_read = Column(Boolean, default=False)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
