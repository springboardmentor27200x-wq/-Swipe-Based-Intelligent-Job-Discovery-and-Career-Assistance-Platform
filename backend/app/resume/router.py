import os
import shutil
import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.config import settings
from app.models.resume import Resume
from app.models.job import Job
from app.auth.utils import get_current_active_user
from app.models.user import User
from app.resume.schemas import ResumeResponse, ATSAnalysisRequest, ATSAnalysisResponse
from app.resume.ats_scorer import ATSScorer

router = APIRouter(prefix="/resume", tags=["resume"])
scorer = ATSScorer()

@router.post("/upload", response_model=ResumeResponse, status_code=status.HTTP_201_CREATED)
def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Validate file type
    filename = file.filename
    _, ext = os.path.splitext(filename.lower())
    if ext not in [".pdf", ".docx"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file type. Only PDF and DOCX are allowed."
        )

    # Setup directories
    user_upload_dir = os.path.join(settings.UPLOAD_DIR, str(current_user.id))
    os.makedirs(user_upload_dir, exist_ok=True)
    
    file_path = os.path.join(user_upload_dir, filename)
    
    # Save file to disk
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not save file: {str(e)}"
        )

    # Get file stats
    file_size = os.path.getsize(file_path)
    if file_size > settings.MAX_FILE_SIZE:
        os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum allowed size of {settings.MAX_FILE_SIZE // (1024*1024)}MB"
        )

    # Parse and extract text / skills
    try:
        extracted_text = scorer.extract_text(file_path)
        extracted_skills = scorer.extract_skills(extracted_text)
    except Exception as e:
        # cleanup file on parsing failure
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Failed to parse resume content: {str(e)}"
        )

    # If this is the user's first resume, or if we want, set it as primary
    has_resumes = db.query(Resume).filter(Resume.user_id == current_user.id).first()
    is_primary = not bool(has_resumes)

    # Save to database
    db_resume = Resume(
        user_id=current_user.id,
        filename=filename,
        file_path=file_path,
        file_size=file_size,
        is_primary=is_primary,
        extracted_text=extracted_text,
        skills_extracted=json.dumps(extracted_skills)
    )
    db.add(db_resume)
    db.commit()
    db.refresh(db_resume)

    # Return response (need to convert skills_extracted from JSON string to list)
    return ResumeResponse(
        id=db_resume.id,
        user_id=db_resume.user_id,
        filename=db_resume.filename,
        file_size=db_resume.file_size,
        is_primary=db_resume.is_primary,
        skills_extracted=extracted_skills,
        created_at=db_resume.created_at
    )

@router.get("/", response_model=List[ResumeResponse])
def list_resumes(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    resumes = db.query(Resume).filter(Resume.user_id == current_user.id).all()
    results = []
    for r in resumes:
        try:
            skills = json.loads(r.skills_extracted)
        except Exception:
            skills = []
        results.append(ResumeResponse(
            id=r.id,
            user_id=r.user_id,
            filename=r.filename,
            file_size=r.file_size,
            is_primary=r.is_primary,
            skills_extracted=skills,
            created_at=r.created_at
        ))
    return results

@router.put("/{resume_id}/set-primary", response_model=ResumeResponse)
def set_primary_resume(
    resume_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Verify resume belongs to user
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    # Unset current primary resumes
    db.query(Resume).filter(Resume.user_id == current_user.id).update({Resume.is_primary: False})
    
    # Set this one as primary
    resume.is_primary = True
    db.commit()
    db.refresh(resume)

    try:
        skills = json.loads(resume.skills_extracted)
    except Exception:
        skills = []

    # Also update user profile skills if user doesn't have any
    if not current_user.skills or current_user.skills == "[]":
        current_user.skills = resume.skills_extracted
        db.commit()

    return ResumeResponse(
        id=resume.id,
        user_id=resume.user_id,
        filename=resume.filename,
        file_size=resume.file_size,
        is_primary=resume.is_primary,
        skills_extracted=skills,
        created_at=resume.created_at
    )

@router.delete("/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_resume(
    resume_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    # Delete file from disk
    if os.path.exists(resume.file_path):
        try:
            os.remove(resume.file_path)
        except Exception as e:
            # log warning but continue
            pass

    is_deleted_primary = resume.is_primary
    db.delete(resume)
    db.commit()

    # If deleted primary, pick another one to be primary
    if is_deleted_primary:
        next_resume = db.query(Resume).filter(Resume.user_id == current_user.id).first()
        if next_resume:
            next_resume.is_primary = True
            db.commit()

    return None

@router.post("/analyze", response_model=ATSAnalysisResponse)
def analyze_resume(
    request: ATSAnalysisRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Get Resume and Job
    resume = db.query(Resume).filter(Resume.id == request.resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
        
    job = db.query(Job).filter(Job.id == request.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Run scorer
    analysis = scorer.calculate_ats_score(resume.extracted_text, job, settings.OPENAI_API_KEY)
    
    return ATSAnalysisResponse(
        resume_id=resume.id,
        job_id=job.id,
        score=analysis["score"],
        matched_skills=analysis["matched_skills"],
        missing_skills=analysis["missing_skills"],
        matched_keywords=analysis["matched_keywords"],
        missing_keywords=analysis["missing_keywords"],
        suggestions=analysis["suggestions"],
        sections_found=analysis["sections_found"]
    )

@router.get("/{resume_id}/text")
def get_resume_text(
    resume_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    return {"text": resume.extracted_text}
