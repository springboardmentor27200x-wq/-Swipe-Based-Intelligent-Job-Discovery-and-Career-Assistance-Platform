import os
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from uuid import UUID
from ..database import get_db
from .. import schemas, crud, models
from .auth import get_current_user
from ..services.resume_parser import extract_text_from_file, extract_skills_from_text, validate_is_resume
from ..services.ats_engine import analyze_ats_match
from ..services.ai_advisor import generate_ai_suggestions, generate_cover_letter, generate_interview_questions, generate_salary_recommendation


router = APIRouter(prefix="/resumes", tags=["resumes"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload", response_model=schemas.ResumeOut)
async def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    # Parse raw text and extract skills
    raw_text = extract_text_from_file(file.filename, file_bytes)

    # Validate if uploaded document resembles a real resume
    is_valid, validation_msg = validate_is_resume(raw_text)
    if not is_valid:
        raise HTTPException(status_code=400, detail=validation_msg)

    # Save file to disk
    user_filename = f"{current_user.id}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, user_filename)
    with open(file_path, "wb") as f:
        f.write(file_bytes)

    parsed_skills = extract_skills_from_text(raw_text)

    # Save/update in database
    db_resume = crud.upsert_resume(
        db,
        user_id=current_user.id,
        filename=file.filename,
        file_path=file_path,
        raw_text=raw_text,
        parsed_skills=parsed_skills
    )

    return db_resume

@router.get("/me", response_model=schemas.ResumeOut)
def get_my_resume(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    resume = crud.get_user_resume(db, current_user.id)
    if not resume:
        raise HTTPException(status_code=404, detail="No resume uploaded yet")
    return resume

@router.post("/analyze/{job_id}", response_model=schemas.ATSAnalysisResponse)
def analyze_resume_for_job(
    job_id: UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    job = crud.get_job_by_id(db, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    resume = crud.get_user_resume(db, current_user.id)
    resume_text = resume.raw_text if resume else ""
    resume_skills = resume.parsed_skills if resume else []

    # Run ATS analysis
    ats_result = analyze_ats_match(
        resume_text=resume_text,
        resume_skills=resume_skills,
        job_title=job.title,
        job_description=job.description or "",
        job_skills=job.skills_required or []
    )

    # Generate AI Suggestions & Salary Recommendation
    suggestions = generate_ai_suggestions(
        job_title=job.title,
        matched_keywords=ats_result["matched_keywords"],
        missing_keywords=ats_result["missing_keywords"],
        ats_score=ats_result["ats_score"]
    )

    salary_rec = generate_salary_recommendation(
        job_title=job.title,
        experience_level=job.experience_level.value if hasattr(job.experience_level, 'value') else str(job.experience_level or ''),
        job_skills=job.skills_required or [],
        salary_min=job.salary_min,
        salary_max=job.salary_max
    )

    return {
        "ats_score": ats_result["ats_score"],
        "match_rating": ats_result["match_rating"],
        "is_high_match": ats_result["is_high_match"],
        "matched_keywords": ats_result["matched_keywords"],
        "missing_keywords": ats_result["missing_keywords"],
        "suggestions": suggestions,
        "salary_recommendation": salary_rec
    }


@router.post("/cover-letter/{job_id}")
def generate_job_cover_letter(
    job_id: UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    job = crud.get_job_by_id(db, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    resume = crud.get_user_resume(db, current_user.id)
    candidate_skills = resume.parsed_skills if resume else []
    candidate_name = current_user.email.split("@")[0].capitalize()
    
    company = db.query(models.Company).filter(models.Company.id == job.company_id).first()
    company_name = company.name if company else "the Company"

    cover_letter = generate_cover_letter(
        candidate_name=candidate_name,
        candidate_skills=candidate_skills,
        job_title=job.title,
        company_name=company_name,
        job_description=job.description or ""
    )


    return {
        "job_title": job.title,
        "company_name": company_name,
        "cover_letter": cover_letter
    }

@router.post("/interview-prep/{job_id}")
def generate_job_interview_prep(
    job_id: UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    job = crud.get_job_by_id(db, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    resume = crud.get_user_resume(db, current_user.id)
    resume_text = resume.raw_text if resume else ""
    resume_skills = resume.parsed_skills if resume else []

    ats_result = analyze_ats_match(
        resume_text=resume_text,
        resume_skills=resume_skills,
        job_title=job.title,
        job_description=job.description or "",
        job_skills=job.skills_required or []
    )

    questions = generate_interview_questions(
        job_title=job.title,
        job_skills=job.skills_required or [],
        missing_keywords=ats_result["missing_keywords"]
    )

    return {
        "job_title": job.title,
        "questions": questions
    }

