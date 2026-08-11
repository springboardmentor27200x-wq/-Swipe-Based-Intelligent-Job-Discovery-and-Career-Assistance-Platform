from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, Text
from app.database import Base


class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    logo_url = Column(String(512), nullable=True)
    description = Column(Text, nullable=True)
    company_type = Column(String(50), nullable=False)  # mnc, startup, new_startup
    industry = Column(String(255), nullable=False)
    size = Column(String(50), nullable=False)  # 1-10, 11-50, 51-200, 201-500, 500+
    location = Column(String(255), nullable=False)
    website = Column(String(512), nullable=True)
    founded_year = Column(Integer, nullable=True)
    is_hiring = Column(Boolean, default=True)
    rating = Column(Float, default=0.0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
