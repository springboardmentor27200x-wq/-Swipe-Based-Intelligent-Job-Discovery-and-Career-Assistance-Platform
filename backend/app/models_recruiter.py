"""
models_recruiter.py
-----------------------------------------------------------------------
NEW model for the recruiter side. Does not modify app/models.py or
app/models_jobseeker.py.

Note: Company, Job, RecruiterProfile, and Application already exist in
models_jobseeker.py (they're shared between both dashboards — a Job
posted by a recruiter is the exact same row a job seeker swipes on).
This file only adds the one genuinely new table the recruiter side
needs: which skills are required for a given job posting.
-----------------------------------------------------------------------
"""

import uuid
from sqlalchemy import Column, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class JobSkill(Base):
    """Join table: which skills are required for a job posting."""
    __tablename__ = "job_skills"
    __table_args__ = (UniqueConstraint("job_id", "skill_id", name="uq_job_skill"),)

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id"), nullable=False)
    skill_id = Column(UUID(as_uuid=True), ForeignKey("skills.id"), nullable=False)

    job = relationship("Job")
    skill = relationship("Skill")
