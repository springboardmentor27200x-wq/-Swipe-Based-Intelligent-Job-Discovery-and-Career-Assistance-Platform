"""
jobseeker.py
-----------------------------------------------------------------------
Mounts at /api/jobseeker/*. Every route requires a logged-in user with
role == job_seeker (enforced via require_role from your existing
dependencies.py).

ATS design (matches the project PDF, Section 6 -- "AI Resume Analyzer &
ATS Scoring"): the ATS Match Score is always a resume-vs-specific-job
comparison, never a standalone score. It's computed at two points:
  1. When the job seeker applies to a job (POST /swipe with action=apply)
  2. On demand, via POST /ats/analyze/{job_id}, so a job seeker can check
     their match BEFORE applying (per the PDF's "if score is below 80%"
     example).

Resume upload itself only parses the file and auto-tags detected skills
onto the profile -- no score is generated at upload time, since there's
no job to compare against yet.

Endpoints:
  GET    /api/jobseeker/dashboard                    -> overview for the Overview tab
  GET    /api/jobseeker/profile                       -> profile for the Profile tab
  PUT    /api/jobseeker/profile                       -> save profile edits
  GET    /api/jobseeker/resumes                        -> resume version list
  POST   /api/jobseeker/resumes                        -> upload a new resume version
  PUT    /api/jobseeker/resumes/{resume_id}/primary     -> set primary resume
  DELETE /api/jobseeker/resumes/{resume_id}             -> delete a non-primary resume
  GET    /api/jobseeker/resumes/{resume_id}/download    -> download a resume (owner or recruiter w/ access)
  GET    /api/jobseeker/ats/latest                      -> most recent ATS analysis
  POST   /api/jobseeker/ats/analyze/{job_id}            -> check ATS match against a specific job
  GET    /api/jobseeker/jobs/discover                    -> swipe queue, ranked by skill match %
  POST   /api/jobseeker/swipe                            -> record skip/save/apply
  GET    /api/jobseeker/applications                     -> applications (optional ?status_filter=)
  DELETE /api/jobseeker/applications/{id}                 -> remove an application row
  GET    /api/jobseeker/notifications                     -> notifications list
  PUT    /api/jobseeker/notifications/{id}/read            -> mark one as read
  PUT    /api/jobseeker/notifications/read-all             -> mark all as read
  DELETE /api/jobseeker/notifications/{id}                 -> dismiss one
-----------------------------------------------------------------------
"""

import re
import json
import os
import uuid
from datetime import datetime
from typing import List, Optional

from pypdf import PdfReader
import docx
import pdfplumber 
import unicodedata

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, Query
from fastapi.responses import FileResponse
from sqlalchemy import func, or_, and_
from datetime import timedelta
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_role, get_current_user
from app.models import User, UserRole
from app.models_recruiter import JobSkill
from app.models_jobseeker import (
    JobSeekerProfile,
    Skill,
    JobSeekerSkill,
    PortfolioLink,
    Resume,
    Job,
    Application,
    ApplicationStatus,
    SwipeAction,
    SwipeActionType,
    ATSAnalysis,
    Notification,
    NotificationType,
    Company,
    Message,
    RecruiterProfile,
    EmploymentType,
    ExperienceLevel,
    CompanyType,
)
from app.schemas_jobseeker import (
    ProfileOut,
    ProfileUpdateIn,
    ResumeOut,
    JobOut,
    SwipeActionIn,
    ApplicationOut,
    NotificationOut,
    DashboardOverviewOut,
    ATSAnalysisOut,
    MessageOut,
    MessageCreateIn,
    CompanySeekerOut,
)

from app.ai_services.embedding_service import get_job_embedding, get_resume_embedding, semantic_similarity
from app.ai_services.gemini_suggestions import generate_ai_suggestions
from app.ai_services.recommendation_engine import get_preferred_skill_weights, swipe_learning_boost

router = APIRouter(prefix="/api/jobseeker", tags=["Job Seeker"])

job_seeker_only = require_role(UserRole.job_seeker)

# Resume files are stored here for now. Swap for S3/GCS in production --
# only the file save/read lines below need to change, nothing in the
# frontend does.
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads", "resumes")
os.makedirs(UPLOAD_DIR, exist_ok=True)

def resume_full_path(resume: Resume) -> str:
    """resume.file_url stores just the filename, not a full path — so
    this always resolves correctly against wherever the project folder
    currently lives, even if it gets moved or deployed elsewhere."""
    return os.path.join(UPLOAD_DIR, resume.file_url)


# ---------------------------------------------------------------------
# Resume text extraction
# ---------------------------------------------------------------------

def _extract_pdf_text_pypdf(file_path: str) -> str:
    text = ""
    reader = PdfReader(file_path)
    for page in reader.pages:
        text += page.extract_text() or ""
    return text


def _extract_pdf_text_pdfplumber(file_path: str) -> str:
    text = ""
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            text += (page.extract_text() or "") + "\n"
    return text


def _find_glued_words(text: str) -> list:
    """Tokens with 2+ lowercase->uppercase transitions inside them are a
    strong sign of multiple real words fused with no space in between
    (e.g. 'MachineLearningEngineer'). Real product names like TensorFlow,
    GitHub, or PostgreSQL only ever have exactly ONE such transition, so
    this won't falsely flag those."""
    tokens = re.findall(r"[A-Za-z]+", text)
    return [t for t in tokens if len(re.findall(r"[a-z][A-Z]", t)) >= 2]


def _looks_broken(text: str) -> bool:
    if not text or len(text.strip()) < 50:
        return True
    letters = sum(1 for c in text if c.isalpha())
    if (letters / max(len(text), 1)) < 0.3:
        return True
    return len(_find_glued_words(text)) >= 1


def normalize_extracted_text(text: str) -> str:
    text = unicodedata.normalize("NFKC", text)
    text = text.replace("\xa0", " ").replace("\u200b", "")
    text = re.sub(r"[ \t]+", " ", text)
    return text


def extract_resume_text(file_path: str) -> str:
    """Pulls raw text out of a resume file, PDF or Word. Tries pypdf
    first (fast); falls back to pdfplumber if the result looks broken
    (common with resume-builder PDFs that glue words together when
    pypdf can't recover spacing from the font's character positions)."""
    ext = os.path.splitext(file_path)[1].lower()

    if ext == ".pdf":
        text = _extract_pdf_text_pypdf(file_path)
        if _looks_broken(text):
            text = _extract_pdf_text_pdfplumber(file_path)
    elif ext in (".docx", ".doc"):
        document = docx.Document(file_path)
        text = "\n".join(p.text for p in document.paragraphs)
    else:
        text = ""

    return normalize_extracted_text(text)


def tokenize(text: str):
    return re.findall(r"[a-zA-Z][a-zA-Z0-9+/#.-]{2,}", text.lower())


# ---------------------------------------------------------------------
# Skill matching -- normalized + alias-aware + word-boundary safe, so
# "Postgres" on a job posting matches "PostgreSQL" on a resume, and "Go"
# doesn't falsely match inside "going" or "background".
# ---------------------------------------------------------------------

COMMON_SKILLS = [
    "React", "Node.js", "Python", "Java", "JavaScript", "TypeScript", "SQL",
    "PostgreSQL", "MongoDB", "AWS", "Azure", "GCP", "Docker", "Kubernetes",
    "Git", "CI/CD", "GraphQL", "REST API", "Django", "FastAPI", "Flask",
    "Spring Boot", "Agile", "Scrum", "HTML", "CSS", "Tailwind CSS", "Redux",
    "Next.js", "Vue.js", "Angular", "C++", "C#", "Golang", "Machine Learning",
    "Data Analysis", "Microsoft Excel", "Figma",
]

SKILL_ALIASES = {
    "postgres": "postgresql",
    "js": "javascript",
    "node": "node.js",
    "nodejs": "node.js",
    "py": "python",
    "k8s": "kubernetes",
    "ml": "machine learning",
    "ts": "typescript",
    "reactjs": "react",
    "react.js": "react",
    "vuejs": "vue.js",
    "restapi": "rest api",
    "cicd": "ci/cd",
}


def normalize_skill_text(value: str) -> str:
    value = value.lower().strip()
    value = re.sub(r"\(.*?\)", "", value)             # drop parenthetical qualifiers
    value = re.sub(r"\b\d+(\.\d+)*\+?\b", "", value)  # drop version numbers like 3.11, 18+
    value = re.sub(r"[^\w\s./+#-]", "", value)        # drop stray punctuation
    value = re.sub(r"\s+", " ", value).strip()
    return SKILL_ALIASES.get(value, value)


def skill_present_in_resume(skill_name: str, resume_lower: str) -> bool:
    normalized = normalize_skill_text(skill_name)
    if not normalized:
        return False
    variants = {normalized, normalized.replace(" ", ""), normalized.replace(".", ""), normalized.replace("-", " ")}
    for v in variants:
        if not v:
            continue
        pattern = r'(?<![a-zA-Z0-9])' + re.escape(v) + r'(?![a-zA-Z0-9])'
        if re.search(pattern, resume_lower):
            return True
    return False


def get_known_skill_names(db: Session) -> list:
    """Skills to check for = everything already in your Skill table
    (grown organically from job postings + profiles) plus a curated
    fallback list, so detection works even on a near-empty database."""
    db_skills = [s.name for s in db.query(Skill).all()]
    combined = {s.lower(): s for s in COMMON_SKILLS}
    for s in db_skills:
        combined[s.lower()] = s
    return list(combined.values())


def detect_skills_in_resume(resume_text: str, known_skill_names: list) -> list:
    resume_lower = resume_text.lower()
    return sorted({s for s in known_skill_names if skill_present_in_resume(s, resume_lower)})


# ---------------------------------------------------------------------
# Job-description keyword extraction (for the "missing keywords" field)
# ---------------------------------------------------------------------

STOPWORDS = {
    "the", "and", "for", "are", "with", "this", "that", "from", "have", "has",
    "will", "you", "your", "our", "their", "of", "to", "in", "on", "at", "as",
    "is", "be", "or", "by", "we", "it", "can", "job", "role", "team", "work",
    "who", "about", "a", "an", "looking", "skilled", "experience", "years",
}


def extract_job_keywords(description: str, exclude: set, top_n: int = 10) -> list:
    words = [w for w in tokenize(description or "") if w not in STOPWORDS and w not in exclude]
    freq = {}
    for w in words:
        freq[w] = freq.get(w, 0) + 1
    ranked = sorted(freq.items(), key=lambda x: -x[1])
    return [w for w, _ in ranked[:top_n]]


def keyword_present_in_resume(keyword: str, resume_lower: str) -> bool:
    pattern = r'(?<![a-zA-Z0-9])' + re.escape(keyword) + r'(?![a-zA-Z0-9])'
    return bool(re.search(pattern, resume_lower))


# ---------------------------------------------------------------------
# ATS Match Score -- always resume vs. one specific job (PDF Section 6)
# ---------------------------------------------------------------------

def compute_job_ats_analysis(resume_text: str, required_skills: list, job_description: str, job_id=None, resume_id=None):
    """Returns (score, missing_skills, missing_keywords, suggestions).
    Now blends skill/keyword overlap with semantic similarity, and
    generates suggestions via Gemini instead of static templates."""
    resume_lower = resume_text.lower()

    missing_skills = [s for s in required_skills if not skill_present_in_resume(s, resume_lower)]
    matched_skills = len(required_skills) - len(missing_skills)
    skill_ratio = matched_skills / len(required_skills) if required_skills else 1.0

    keywords = extract_job_keywords(job_description, exclude={s.lower() for s in required_skills})
    missing_keywords = [k for k in keywords if not keyword_present_in_resume(k, resume_lower)]
    matched_keywords = len(keywords) - len(missing_keywords)
    keyword_ratio = matched_keywords / len(keywords) if keywords else 1.0

    # NEW: semantic similarity catches things keyword matching misses,
    # e.g. "led a team of 5 engineers" implying leadership.
    job_embedding = get_job_embedding(job_id or job_description, job_description)
    resume_embedding = get_resume_embedding(resume_id or resume_text, resume_text)
    semantic_score = max(semantic_similarity(resume_embedding, job_embedding), 0.0)

    # Blended score: 50% skills, 20% keywords, 30% semantic similarity.
    score = round(skill_ratio * 0.5 * 100 + keyword_ratio * 0.2 * 100 + semantic_score * 0.3 * 100)

    # NEW: real AI-generated suggestions instead of hardcoded templates
    suggestions = generate_ai_suggestions(resume_text, job_description, missing_skills, missing_keywords, score)

    return score, missing_skills, missing_keywords, suggestions
    """Returns (score, missing_skills, missing_keywords, suggestions)."""
    resume_lower = resume_text.lower()

    missing_skills = [s for s in required_skills if not skill_present_in_resume(s, resume_lower)]
    matched_skills = len(required_skills) - len(missing_skills)
    skill_ratio = matched_skills / len(required_skills) if required_skills else 1.0

    keywords = extract_job_keywords(job_description, exclude={s.lower() for s in required_skills})
    missing_keywords = [k for k in keywords if not keyword_present_in_resume(k, resume_lower)]
    matched_keywords = len(keywords) - len(missing_keywords)
    keyword_ratio = matched_keywords / len(keywords) if keywords else 1.0

    score = round(skill_ratio * 0.7 * 100 + keyword_ratio * 0.3 * 100)

    suggestions = []
    if missing_skills:
        suggestions.append(f"Add these required skills if you have them: {', '.join(missing_skills[:5])}.")
    if missing_keywords:
        suggestions.append(f"Mirror these terms from the job description: {', '.join(missing_keywords[:5])}.")
    if score >= 80:
        suggestions.append("Strong match -- you're well aligned with this role's requirements.")
    elif not suggestions:
        suggestions.append("Add quantifiable achievements and role-specific terminology to strengthen your match.")

    return score, missing_skills, missing_keywords, suggestions


def run_and_store_ats_analysis(db: Session, resume: Resume, job: Job) -> ATSAnalysisOut:
    """Shared by the apply-flow and the on-demand check endpoint, so both
    paths score identically and both write the same kind of ATSAnalysis row."""
    resume_text = extract_resume_text(resume_full_path(resume))
    # print("=== EXTRACTED RESUME TEXT (first 500 chars) ===")
    # print(repr(resume_text[:500]))
    # print("=== LENGTH:", len(resume_text), "===")
    required_skills = [js.skill.name for js in db.query(JobSkill).filter_by(job_id=job.id).all()]
    score, missing_skills, missing_keywords, suggestions = compute_job_ats_analysis(
        resume_text, required_skills, job.description, job_id=job.id, resume_id=resume.id
    )

    db.add(
        ATSAnalysis(
            resume_id=resume.id,
            job_id=job.id,
            score=score,
            missing_skills=json.dumps(missing_skills),
            missing_keywords=json.dumps(missing_keywords),
            suggestions=json.dumps(suggestions),
        )
    )

    return ATSAnalysisOut(
        score=score,
        missing_skills=missing_skills,
        missing_keywords=missing_keywords,
        suggestions=suggestions,
    )


# ---------------------------------------------------------------------
# General helpers
# ---------------------------------------------------------------------

def get_or_create_profile(db: Session, user: User) -> JobSeekerProfile:
    """Every job seeker gets a profile lazily on first dashboard visit."""
    profile = db.query(JobSeekerProfile).filter_by(user_id=user.id).first()
    if profile is None:
        profile = JobSeekerProfile(user_id=user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


def compute_profile_completion(profile: JobSeekerProfile) -> int:
    """
    0-100, computed from what's actually filled in -- never stored, so it
    can't go stale relative to the real rows.
    """
    checks = [
        bool(profile.headline),
        len(profile.resumes) > 0,
        len(profile.skills) > 0,
        len(profile.portfolio_links) > 0,
    ]
    return int(sum(checks) / len(checks) * 100)


def get_applicant_count(db: Session, job_id) -> int:
    """Applicants = applications beyond just 'saved' (saved is private to the seeker)."""
    return (
        db.query(Application)
        .filter(Application.job_id == job_id, Application.status != ApplicationStatus.saved)
        .count()
    )


def compute_competition_level(applicant_count: int) -> str:
    if applicant_count < 10:
        return "Low"
    if applicant_count < 30:
        return "Medium"
    return "High"


def job_to_out(db: Session, job: Job, seeker_skills: set = None, resume_text: str = None, preferred_weights: dict = None) -> JobOut:
    """seeker_skills is used for skill-overlap match %. resume_text (optional)
    adds semantic similarity on top. preferred_weights (optional) adds a
    swipe-learned boost based on the user's SwipeAction history."""
    applicant_count = get_applicant_count(db, job.id)

    required_skills = [
        js.skill.name for js in db.query(JobSkill).filter_by(job_id=job.id).all()
    ]

    match_score = None
    if seeker_skills is not None and required_skills:
        required_normalized = {normalize_skill_text(s) for s in required_skills}
        overlap = len(required_normalized & seeker_skills)
        match_score = round(overlap / len(required_normalized) * 100)

        # NEW: blend in semantic similarity if we have resume text to compare
        if resume_text:
            job_embedding = get_job_embedding(job.id, job.description)
            resume_embedding = get_resume_embedding(resume_text, resume_text)
            semantic = max(semantic_similarity(resume_embedding, job_embedding), 0.0)
            match_score = round(match_score * 0.6 + semantic * 100 * 0.4)

        # NEW: nudge ranking using what the user has swiped on before
        if preferred_weights:
            boost = swipe_learning_boost(required_skills, preferred_weights)
            match_score = max(0, min(100, round(match_score + boost)))

    return JobOut(
        id=job.id,
        title=job.title,
        company_name=job.company.name,
        company_type=job.company.company_type,
        location=job.location,
        employment_type=job.employment_type,
        experience_level=job.experience_level,
        salary_min=job.salary_min,
        salary_max=job.salary_max,
        posted_at=job.posted_at,
        applicant_count=applicant_count,
        competition_level=compute_competition_level(applicant_count),
        match_score=match_score,
        skills=required_skills,
    )
    # """seeker_skills, if provided, is used to compute the recommendation
    # match % (PDF Section 7) -- a separate concept from the ATS Match Score
    # (Section 6), which only exists per-application."""
    # applicant_count = get_applicant_count(db, job.id)

    # match_score = None
    # if seeker_skills is not None:
    #     required_skills = [
    #         js.skill.name for js in db.query(JobSkill).filter_by(job_id=job.id).all()
    #     ]
    #     if required_skills:
    #         required_normalized = {normalize_skill_text(s) for s in required_skills}
    #         overlap = len(required_normalized & seeker_skills)
    #         match_score = round(overlap / len(required_normalized) * 100)

    # return JobOut(
    #     id=job.id,
    #     title=job.title,
    #     company_name=job.company.name,
    #     company_type=job.company.company_type,
    #     location=job.location,
    #     employment_type=job.employment_type,
    #     experience_level=job.experience_level,
    #     salary_min=job.salary_min,
    #     salary_max=job.salary_max,
    #     posted_at=job.posted_at,
    #     applicant_count=applicant_count,
    #     competition_level=compute_competition_level(applicant_count),
    #     match_score=match_score,
    # )

HIGH_MATCH_THRESHOLD = 80
RELEVANT_MATCH_THRESHOLD = 50


def generate_notifications_for_new_job(db: Session, job: Job) -> None:
    """Called once, right after a recruiter posts a new job. Proactively
    scans every active job seeker and creates the appropriate alert(s) --
    the 'push' half of Smart Notifications & Alerts (PDF Section 8)."""
    required_skills = [
        js.skill.name for js in db.query(JobSkill).filter_by(job_id=job.id).all()
    ]
    required_normalized = {normalize_skill_text(s) for s in required_skills}

    applicant_count = get_applicant_count(db, job.id)
    competition_level = compute_competition_level(applicant_count)
    is_new_company = job.company.company_type in (CompanyType.startup, CompanyType.newly_founded)

    profiles = (
        db.query(JobSeekerProfile)
        .join(User, JobSeekerProfile.user_id == User.id)
        .filter(User.is_active.is_(True))
        .all()
    )

    print(f"[notif-debug] job='{job.title}' required_skills={required_skills} company_type={job.company.company_type} applicant_count={applicant_count} competition={competition_level} profiles_scanned={len(profiles)}")

    for profile in profiles:
        seeker_skills = {normalize_skill_text(js.skill.name) for js in profile.skills}

        match_score = None
        if required_normalized and seeker_skills:
            overlap = len(required_normalized & seeker_skills)
            match_score = round(overlap / len(required_normalized) * 100)

        print(f"[notif-debug]   seeker_user_id={profile.user_id} seeker_skills={seeker_skills} match_score={match_score}")

        if match_score is not None and match_score >= HIGH_MATCH_THRESHOLD:
            db.add(Notification(
                user_id=profile.user_id,
                type=NotificationType.high_match,
                text=f"High match: {job.title} at {job.company.name} — {match_score}% match with your skills.",
                related_job_id=job.id,
            ))
        elif match_score is not None and match_score >= RELEVANT_MATCH_THRESHOLD:
            db.add(Notification(
                user_id=profile.user_id,
                type=NotificationType.general,
                text=f"New job matching your profile: {job.title} at {job.company.name} ({match_score}% match).",
                related_job_id=job.id,
            ))

        if (
            match_score is not None
            and match_score >= RELEVANT_MATCH_THRESHOLD
            and competition_level == "Low"
        ):
            db.add(Notification(
                user_id=profile.user_id,
                type=NotificationType.low_competition,
                text=f"Low competition: only {applicant_count} applicant(s) so far for {job.title} at {job.company.name}.",
                related_job_id=job.id,
            ))

        if is_new_company:
            db.add(Notification(
                user_id=profile.user_id,
                type=NotificationType.startup,
                text=f"New opening at {job.company.name} ({job.company.company_type.value}): {job.title}.",
                related_job_id=job.id,
            ))

    db.commit()


def application_to_out(app_row: Application, db: Session) -> ApplicationOut:
    return ApplicationOut(
        id=app_row.id,
        job=job_to_out(db, app_row.job),
        status=app_row.status,
        ats_match_score=app_row.ats_match_score,
        applied_at=app_row.applied_at,
    )


# ---------------------------------------------------------------------
# Profile
# ---------------------------------------------------------------------

@router.get("/profile", response_model=ProfileOut)
def get_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(job_seeker_only),
):
    profile = get_or_create_profile(db, current_user)
    return ProfileOut(
        full_name=current_user.full_name,
        email=current_user.email,
        headline=profile.headline,
        location=profile.location,
        experience_level=profile.experience_level,
        skills=[js.skill for js in profile.skills],
        portfolio_links=profile.portfolio_links,
        profile_completion=compute_profile_completion(profile),
    )


@router.put("/profile", response_model=ProfileOut)
def update_profile(
    payload: ProfileUpdateIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(job_seeker_only),
):
    profile = get_or_create_profile(db, current_user)

    if payload.headline is not None:
        profile.headline = payload.headline
    if payload.location is not None:
        profile.location = payload.location
    if payload.experience_level is not None:
        profile.experience_level = payload.experience_level

    if payload.skills is not None:
        db.query(JobSeekerSkill).filter_by(profile_id=profile.id).delete()
        for name in payload.skills:
            skill = db.query(Skill).filter_by(name=name).first()
            if skill is None:
                skill = Skill(name=name)
                db.add(skill)
                db.flush()
            db.add(JobSeekerSkill(profile_id=profile.id, skill_id=skill.id))

    if payload.portfolio_links is not None:
        db.query(PortfolioLink).filter_by(profile_id=profile.id).delete()
        for url in payload.portfolio_links:
            db.add(PortfolioLink(profile_id=profile.id, url=url))

    db.commit()
    db.refresh(profile)
    return get_profile(db=db, current_user=current_user)


# ---------------------------------------------------------------------
# Resumes
# ---------------------------------------------------------------------

@router.get("/resumes", response_model=List[ResumeOut])
def list_resumes(
    db: Session = Depends(get_db),
    current_user: User = Depends(job_seeker_only),
):
    profile = get_or_create_profile(db, current_user)
    return (
        db.query(Resume)
        .filter_by(profile_id=profile.id)
        .order_by(Resume.uploaded_at.desc())
        .all()
    )


@router.post("/resumes", response_model=ResumeOut, status_code=status.HTTP_201_CREATED)
def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(job_seeker_only),
):
    if not file.filename.lower().endswith((".pdf", ".doc", ".docx")):
        raise HTTPException(status_code=400, detail="Only PDF or Word documents are accepted")

    profile = get_or_create_profile(db, current_user)

    stored_name = f"{uuid.uuid4()}_{file.filename}"
    stored_path = os.path.join(UPLOAD_DIR, stored_name)
    with open(stored_path, "wb") as f:
        f.write(file.file.read())

    existing_count = db.query(Resume).filter_by(profile_id=profile.id).count()
    db.query(Resume).filter_by(profile_id=profile.id, is_primary=True).update({"is_primary": False})

    resume = Resume(
        profile_id=profile.id,
        file_name=file.filename,
        file_url=stored_name,
        version_number=existing_count + 1,
        is_primary=True,
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)

    # Parse the resume and auto-tag detected skills onto the profile.
    # No ATS score is generated here -- scoring only happens against a
    # specific job (see /ats/analyze/{job_id} and the apply flow below).
    known_skills = get_known_skill_names(db)
    resume_text = extract_resume_text(stored_path)
    detected_skills = detect_skills_in_resume(resume_text, known_skills)

    for skill_name in detected_skills:
        skill = db.query(Skill).filter_by(name=skill_name).first()
        if skill is None:
            skill = Skill(name=skill_name)
            db.add(skill)
            db.flush()
        already_tagged = (
            db.query(JobSeekerSkill)
            .filter_by(profile_id=profile.id, skill_id=skill.id)
            .first()
        )
        if not already_tagged:
            db.add(JobSeekerSkill(profile_id=profile.id, skill_id=skill.id))

    db.commit()
    return resume


@router.put("/resumes/{resume_id}/primary", response_model=ResumeOut)
def set_primary_resume(
    resume_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(job_seeker_only),
):
    profile = get_or_create_profile(db, current_user)
    resume = db.query(Resume).filter_by(id=resume_id, profile_id=profile.id).first()
    if resume is None:
        raise HTTPException(status_code=404, detail="Resume not found")

    db.query(Resume).filter_by(profile_id=profile.id, is_primary=True).update(
        {"is_primary": False}
    )
    resume.is_primary = True

    # Re-parse the newly selected primary resume and refresh profile skills.
    resume_text = extract_resume_text(resume_full_path(resume))
    detected_skills = detect_skills_in_resume(resume_text, get_known_skill_names(db))

    db.query(JobSeekerSkill).filter_by(profile_id=profile.id).delete()
    for skill_name in detected_skills:
        skill = db.query(Skill).filter_by(name=skill_name).first()
        if skill is None:
            skill = Skill(name=skill_name)
            db.add(skill)
            db.flush()
        db.add(JobSeekerSkill(profile_id=profile.id, skill_id=skill.id))

    db.commit()
    db.refresh(resume)
    return resume


@router.delete("/resumes/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_resume(
    resume_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(job_seeker_only),
):
    profile = get_or_create_profile(db, current_user)
    resume = db.query(Resume).filter_by(id=resume_id, profile_id=profile.id).first()

    if resume is None:
        raise HTTPException(status_code=404, detail="Resume not found")

    if resume.is_primary:
        raise HTTPException(status_code=400, detail="Cannot delete your primary resume. Set another resume as primary first.")

    full_path = resume_full_path(resume)
    if os.path.exists(full_path):
        try:
            os.remove(full_path)
        except OSError:
            pass

    db.query(ATSAnalysis).filter_by(resume_id=resume.id).delete()
    db.delete(resume)
    db.commit()
    return None


@router.get("/resumes/{resume_id}/download")
def download_resume(
    resume_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resume = db.query(Resume).filter_by(id=resume_id).first()
    if resume is None:
        raise HTTPException(status_code=404, detail="Resume not found")

    owner_profile = resume.profile
    is_owner = owner_profile.user_id == current_user.id

    is_recruiter_with_access = False
    if current_user.role == UserRole.recruiter:
        recruiter_profile = db.query(RecruiterProfile).filter_by(user_id=current_user.id).first()
        if recruiter_profile:
            owned_company_ids = [
                c.id
                for c in db.query(Company)
                .filter_by(owner_recruiter_profile_id=recruiter_profile.id)
                .all()
            ]
            has_application = (
                db.query(Application)
                .join(Job, Application.job_id == Job.id)
                .filter(
                    Application.job_seeker_profile_id == owner_profile.id,
                    Job.company_id.in_(owned_company_ids),
                    Application.status != ApplicationStatus.saved,
                )
                .first()
            )
            is_recruiter_with_access = has_application is not None

    if not (is_owner or is_recruiter_with_access):
        raise HTTPException(status_code=403, detail="You don't have access to this resume")

    full_path = resume_full_path(resume)
    if not os.path.exists(full_path):
        raise HTTPException(status_code=404, detail="Resume file missing on server")

    return FileResponse(full_path, filename=resume.file_name)


# ---------------------------------------------------------------------
# ATS analysis -- always resume vs. a specific job
# ---------------------------------------------------------------------

@router.get("/ats/latest", response_model=Optional[ATSAnalysisOut])
def get_latest_ats(
    db: Session = Depends(get_db),
    current_user: User = Depends(job_seeker_only),
):
    profile = get_or_create_profile(db, current_user)
    analysis = (
        db.query(ATSAnalysis)
        .join(Resume, ATSAnalysis.resume_id == Resume.id)
        .filter(Resume.profile_id == profile.id)
        .order_by(ATSAnalysis.analyzed_at.desc())
        .first()
    )
    if analysis is None:
        return None
    return ATSAnalysisOut(
        score=analysis.score,
        missing_skills=json.loads(analysis.missing_skills or "[]"),
        missing_keywords=json.loads(analysis.missing_keywords or "[]"),
        suggestions=json.loads(analysis.suggestions or "[]"),
    )


@router.post("/ats/analyze/{job_id}", response_model=ATSAnalysisOut)
def analyze_against_job(
    job_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(job_seeker_only),
):
    """Lets a job seeker check their ATS Match Score against a job BEFORE
    applying -- matches the PDF's 'if ATS Match Score is below 80%' example."""
    profile = get_or_create_profile(db, current_user)
    job = db.query(Job).filter_by(id=job_id).first()
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")

    primary_resume = db.query(Resume).filter_by(profile_id=profile.id, is_primary=True).first()
    if primary_resume is None:
        raise HTTPException(status_code=400, detail="Upload a resume first")

    result = run_and_store_ats_analysis(db, primary_resume, job)
    db.commit()
    return result


# ---------------------------------------------------------------------
# Discover / swipe
# ---------------------------------------------------------------------

@router.get("/jobs/discover", response_model=List[JobOut])
def discover_jobs(
    limit: int = 50,
    search: Optional[str] = Query(None, description="Matches job title or company name"),
    company_type: Optional[CompanyType] = None,
    employment_type: Optional[EmploymentType] = None,
    experience_level: Optional[ExperienceLevel] = None,
    location: Optional[str] = Query(None, description="Partial match, case-insensitive"),
    skill: Optional[str] = Query(None, description="Comma-separated required skills, case-insensitive (matches jobs needing ANY of them)"),
    salary_min: Optional[float] = None,
    salary_max: Optional[float] = None,
    fresher_friendly: bool = False,
    low_competition: bool = False,
    recently_posted: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(job_seeker_only),
):
    profile = get_or_create_profile(db, current_user)

    already_applied_ids = [
        row.job_id for row in db.query(Application.job_id).filter_by(job_seeker_profile_id=profile.id)
    ]
    exclude_ids = set(already_applied_ids)

    query = db.query(Job).join(Company).filter(Job.is_active.is_(True))

    if exclude_ids:
        query = query.filter(~Job.id.in_(exclude_ids))

    if search:
        like = f"%{search}%"
        query = query.filter(or_(Job.title.ilike(like), Company.name.ilike(like)))

    if company_type:
        query = query.filter(Company.company_type == company_type)

    if employment_type:
        query = query.filter(Job.employment_type == employment_type)

    if experience_level:
        query = query.filter(Job.experience_level == experience_level)

    if fresher_friendly:
        query = query.filter(Job.experience_level == ExperienceLevel.fresher)

    if location:
        query = query.filter(Job.location.ilike(f"%{location}%"))

    if salary_min is not None:
        query = query.filter(or_(Job.salary_max.is_(None), Job.salary_max >= salary_min))

    if salary_max is not None:
        query = query.filter(or_(Job.salary_min.is_(None), Job.salary_min <= salary_max))

    if recently_posted:
        cutoff = datetime.utcnow() - timedelta(days=7)
        query = query.filter(Job.posted_at >= cutoff)

    if skill:
        requested_skills = {
            normalize_skill_text(s) for s in skill.split(",") if s.strip()
        }
        if requested_skills:
            job_ids_with_skill = {
                js.job_id for js in db.query(JobSkill).join(Skill).all()
                if normalize_skill_text(js.skill.name) in requested_skills
            }
            if job_ids_with_skill:
                query = query.filter(Job.id.in_(job_ids_with_skill))
            else:
                return []

    jobs = query.order_by(Job.posted_at.desc()).all()

    seeker_skills = {normalize_skill_text(js.skill.name) for js in profile.skills}

    # NEW: fetch primary resume text once (not per-job) for semantic scoring
    primary_resume = db.query(Resume).filter_by(profile_id=profile.id, is_primary=True).first()
    resume_text = extract_resume_text(resume_full_path(primary_resume)) if primary_resume else None

    # NEW: build swipe-learned preference weights once (not per-job)
    preferred_weights = get_preferred_skill_weights(db, profile.id)

    scored_jobs = [
        job_to_out(db, job, seeker_skills=seeker_skills, resume_text=resume_text, preferred_weights=preferred_weights)
        for job in jobs
    ]

    if low_competition:
        scored_jobs = [j for j in scored_jobs if j.competition_level == "Low"]

    # Best matches first; jobs with no computable match fall to the end.
    scored_jobs.sort(key=lambda j: (j.match_score is None, -(j.match_score or 0)))

    return scored_jobs[:limit]

@router.post("/swipe", status_code=status.HTTP_204_NO_CONTENT)
def record_swipe(
    payload: SwipeActionIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(job_seeker_only),
):
    profile = get_or_create_profile(db, current_user)
    job = db.query(Job).filter_by(id=payload.job_id).first()
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")

    db.add(
        SwipeAction(
            job_seeker_profile_id=profile.id,
            job_id=job.id,
            action=payload.action,
        )
    )

    if payload.action in (SwipeActionType.save, SwipeActionType.apply):
        existing = (
            db.query(Application)
            .filter_by(job_seeker_profile_id=profile.id, job_id=job.id)
            .first()
        )
        if existing is None:
            existing = Application(job_seeker_profile_id=profile.id, job_id=job.id)
            db.add(existing)

        if payload.action == SwipeActionType.save:
            existing.status = ApplicationStatus.saved
        elif payload.action == SwipeActionType.apply:
            existing.status = ApplicationStatus.applied
            existing.applied_at = datetime.utcnow()

             # Notify every recruiter on this job's company that a new
            # application came in.
            # Notify the recruiter who OWNS this job's company (ownership,
            # not "currently active company" — a recruiter can own
            # multiple companies and switch which one is active).
            owning_company = db.query(Company).filter_by(id=job.company_id).first()
            if owning_company and owning_company.owner_recruiter_profile_id:
                owning_recruiter_profile = (
                    db.query(RecruiterProfile)
                    .filter_by(id=owning_company.owner_recruiter_profile_id)
                    .first()
                )
                if owning_recruiter_profile:
                    db.add(
                        Notification(
                            user_id=owning_recruiter_profile.user_id,
                            type=NotificationType.general,
                            text=f"{current_user.full_name} applied for {job.title}.",
                        )
                    )

            primary_resume = (
                db.query(Resume)
                .filter_by(profile_id=profile.id, is_primary=True)
                .first()
            )
            if primary_resume:
                ats_result = run_and_store_ats_analysis(db, primary_resume, job)
                existing.ats_match_score = ats_result.score

                db.add(
                Notification(
                    user_id=current_user.id,
                    type=NotificationType.general,
                    text=f"Application submitted for {job.title} at {job.company.name}.",
                )
            )

    db.commit()
    return None


# ---------------------------------------------------------------------
# Applications
# ---------------------------------------------------------------------

@router.get("/applications", response_model=List[ApplicationOut])
def list_applications(
    status_filter: Optional[ApplicationStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(job_seeker_only),
):
    profile = get_or_create_profile(db, current_user)
    query = db.query(Application).filter_by(job_seeker_profile_id=profile.id)
    if status_filter is not None:
        query = query.filter(Application.status == status_filter)
    rows = query.order_by(Application.updated_at.desc()).all()
    return [application_to_out(row, db) for row in rows]


@router.delete("/applications/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_application(
    application_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(job_seeker_only),
):
    profile = get_or_create_profile(db, current_user)
    row = db.query(Application).filter_by(id=application_id, job_seeker_profile_id=profile.id).first()
    if row is None:
        raise HTTPException(status_code=404, detail="Application not found")
    db.delete(row)
    db.commit()
    return None


# ---------------------------------------------------------------------
# Notifications
# ---------------------------------------------------------------------

@router.get("/notifications", response_model=List[NotificationOut])
def list_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(job_seeker_only),
):
    return (
        db.query(Notification)
        .filter_by(user_id=current_user.id)
        .order_by(Notification.created_at.desc())
        .all()
    )


@router.put("/notifications/read-all", status_code=status.HTTP_204_NO_CONTENT)
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(job_seeker_only),
):
    db.query(Notification).filter_by(user_id=current_user.id, is_read=False).update({"is_read": True})
    db.commit()
    return None


@router.put("/notifications/{notification_id}/read", response_model=NotificationOut)
def mark_notification_read(
    notification_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(job_seeker_only),
):
    notification = db.query(Notification).filter_by(id=notification_id, user_id=current_user.id).first()
    if notification is None:
        raise HTTPException(status_code=404, detail="Notification not found")
    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return notification


@router.delete("/notifications/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
def dismiss_notification(
    notification_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(job_seeker_only),
):
    notification = db.query(Notification).filter_by(id=notification_id, user_id=current_user.id).first()
    if notification is None:
        raise HTTPException(status_code=404, detail="Notification not found")
    db.delete(notification)
    db.commit()
    return None


# ---------------------------------------------------------------------
# Combined overview (Overview tab -- one call instead of five)
# ---------------------------------------------------------------------

@router.get("/dashboard", response_model=DashboardOverviewOut)
def dashboard_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(job_seeker_only),
):
    profile = get_or_create_profile(db, current_user)

    profile_out = ProfileOut(
        full_name=current_user.full_name,
        email=current_user.email,
        headline=profile.headline,
        location=profile.location,
        experience_level=profile.experience_level,
        skills=[js.skill for js in profile.skills],
        portfolio_links=profile.portfolio_links,
        profile_completion=compute_profile_completion(profile),
    )

    resume_count = db.query(Resume).filter_by(profile_id=profile.id).count()

    counts_query = (
        db.query(Application.status, func.count(Application.id))
        .filter(Application.job_seeker_profile_id == profile.id)
        .group_by(Application.status)
        .all()
    )
    application_counts = {s.value: 0 for s in ApplicationStatus}
    for status_val, count in counts_query:
        application_counts[status_val.value] = count

    latest_ats = get_latest_ats(db=db, current_user=current_user)

    recommended = discover_jobs(limit=3, db=db, current_user=current_user)

    notifications = (
        db.query(Notification)
        .filter_by(user_id=current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(3)
        .all()
    )

    return DashboardOverviewOut(
        profile=profile_out,
        resume_count=resume_count,
        application_counts=application_counts,
        latest_ats=latest_ats,
        recommended_jobs=recommended,
        recent_notifications=notifications,
    )

@router.get("/applications/{application_id}/messages", response_model=List[MessageOut])
def list_application_messages(
    application_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(job_seeker_only),
):
    profile = get_or_create_profile(db, current_user)
    application = db.query(Application).filter_by(id=application_id, job_seeker_profile_id=profile.id).first()
    if application is None:
        raise HTTPException(status_code=404, detail="Application not found")

    messages = db.query(Message).filter_by(application_id=application_id).order_by(Message.created_at).all()
    # Mark messages sent TO the job seeker as read, now that they're viewing them.
    db.query(Message).filter(
        Message.application_id == application_id, Message.sender_user_id != current_user.id
    ).update({"is_read": True})
    db.commit()

    return [
        MessageOut(
            id=m.id, application_id=m.application_id, sender_user_id=m.sender_user_id,
            sender_name=m.sender.full_name, is_mine=(m.sender_user_id == current_user.id),
            body=m.body, is_read=m.is_read, created_at=m.created_at,
        )
        for m in messages
    ]


@router.post("/applications/{application_id}/messages", response_model=MessageOut, status_code=status.HTTP_201_CREATED)
def send_application_message(
    application_id: uuid.UUID,
    payload: MessageCreateIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(job_seeker_only),
):
    profile = get_or_create_profile(db, current_user)
    application = db.query(Application).filter_by(id=application_id, job_seeker_profile_id=profile.id).first()
    if application is None:
        raise HTTPException(status_code=404, detail="Application not found")

    message = Message(application_id=application_id, sender_user_id=current_user.id, body=payload.body)
    db.add(message)

    # Notify the recruiter who owns this job.
    recruiter_profile = (
        db.query(RecruiterProfile)
        .join(Company, RecruiterProfile.company_id == Company.id)
        .filter(Company.id == application.job.company_id)
        .first()
    )
    if recruiter_profile:
        db.add(Notification(
            user_id=recruiter_profile.user_id,
            type=NotificationType.general,
            text=f"New message from {current_user.full_name} about {application.job.title}.",
        ))

    db.commit()
    db.refresh(message)
    return MessageOut(
        id=message.id, application_id=message.application_id, sender_user_id=message.sender_user_id,
        sender_name=current_user.full_name, is_mine=True, body=message.body,
        is_read=message.is_read, created_at=message.created_at,
    )

@router.delete("/applications/{application_id}/messages", status_code=status.HTTP_204_NO_CONTENT)
def clear_application_messages(
    application_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(job_seeker_only),
):
    profile = get_or_create_profile(db, current_user)
    application = db.query(Application).filter_by(id=application_id, job_seeker_profile_id=profile.id).first()
    if application is None:
        raise HTTPException(status_code=404, detail="Application not found")

    db.query(Message).filter_by(application_id=application_id).delete()
    db.commit()
    return None


@router.delete("/applications/{application_id}/messages/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_application_message(
    application_id: uuid.UUID,
    message_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(job_seeker_only),
):
    profile = get_or_create_profile(db, current_user)
    application = db.query(Application).filter_by(id=application_id, job_seeker_profile_id=profile.id).first()
    if application is None:
        raise HTTPException(status_code=404, detail="Application not found")

    message = db.query(Message).filter_by(id=message_id, application_id=application_id).first()
    if message is None:
        raise HTTPException(status_code=404, detail="Message not found")
    if message.sender_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own messages")

    db.delete(message)
    db.commit()
    return None


@router.get("/companies", response_model=List[CompanySeekerOut])
def list_companies_directory(
    company_type: Optional[CompanyType] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(job_seeker_only),
):
    query = db.query(Company).filter(Company.name != "")
    if company_type:
        query = query.filter(Company.company_type == company_type)
    
    companies = query.order_by(Company.name).all()
    results = []
    for comp in companies:
        active_count = db.query(Job).filter(Job.company_id == comp.id, Job.is_active.is_(True)).count()
        results.append(
            CompanySeekerOut(
                id=comp.id,
                name=comp.name,
                company_type=comp.company_type,
                website=comp.website,
                logo_url=comp.logo_url,
                active_jobs_count=active_count,
            )
        )
    return results