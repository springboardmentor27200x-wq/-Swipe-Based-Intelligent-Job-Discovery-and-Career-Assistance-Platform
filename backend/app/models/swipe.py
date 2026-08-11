from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from app.database import Base


class Swipe(Base):
    __tablename__ = "swipes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False, index=True)
    direction = Column(String(10), nullable=False)  # left, right
    action = Column(String(20), nullable=False)  # skip, apply, save
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
