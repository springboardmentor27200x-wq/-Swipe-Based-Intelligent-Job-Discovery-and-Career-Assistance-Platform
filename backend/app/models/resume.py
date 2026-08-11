from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from app.database import Base


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    filename = Column(String(512), nullable=False)
    file_path = Column(String(1024), nullable=False)
    file_size = Column(Integer, nullable=False)
    is_primary = Column(Boolean, default=False)
    extracted_text = Column(Text, nullable=True)
    skills_extracted = Column(Text, default="[]")  # JSON list
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
