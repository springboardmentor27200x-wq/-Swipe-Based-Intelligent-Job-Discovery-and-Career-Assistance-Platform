import os
import shutil

from fastapi import (
    FastAPI,
    Depends,
    HTTPException,
    UploadFile,
    File
)

from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy.orm import Session

from sqlalchemy import func

from database import (
    SessionLocal,
    engine,
    Base
)

import models
import schemas

from resume_analyzer import (
    extract_text,
    extract_skills,
    ats_score,
    match_resume,
    generate_suggestions
)


# =========================================================
# DATABASE TABLES
# =========================================================

Base.metadata.create_all(
    bind=engine
)


# =========================================================
# FASTAPI
# =========================================================

app = FastAPI(
    title="SwipeX API"
)


# =========================================================
# CORS
# =========================================================

FRONTEND_URL = os.getenv(
    "FRONTEND_URL"
)

allowed_origins = [
    "http://127.0.0.1:5500",
    "http://localhost:5500"
]

if FRONTEND_URL:
    allowed_origins.append(
        FRONTEND_URL.rstrip("/")
    )

app.add_middleware(
    CORSMiddleware,

    allow_origins=allowed_origins,

    # Allow ANY Live Server localhost port
    allow_origin_regex=
        r"^http://(localhost|127\.0\.0\.1):\d+$",

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"]
)

# =========================================================
# PATHS
# =========================================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

UPLOAD_FOLDER = "/tmp/uploads"
os.makedirs(
    UPLOAD_FOLDER,
    exist_ok=True
)

# =========================================================
# DATABASE DEPENDENCY
# =========================================================

def get_db():

    db = SessionLocal()

    try:

        yield db

    finally:

        db.close()


# =========================================================
# NOTIFICATION HELPERS
# =========================================================

def notification_exists(
    db: Session,
    username: str,
    title: str,
    message: str
):

    return (
        db.query(
            models.Notification
        )
        .filter(
            models.Notification.username == username,

            models.Notification.title == title,

            models.Notification.message == message
        )
        .first()
        is not None
    )


# =========================================================
# ADD NOTIFICATION IF IT DOES NOT EXIST
# =========================================================

def add_notification_if_missing(
    db: Session,
    username: str,
    title: str,
    message: str
):

    if not username:

        return False


    if notification_exists(
        db,
        username,
        title,
        message
    ):

        return False


    notification = models.Notification(

        username=username,

        title=title,

        message=message,

        is_read=False
    )


    db.add(
        notification
    )


    return True


# =========================================================
# BACKFILL OLD APPLICATION NOTIFICATIONS
# =========================================================

def backfill_application_notifications(
    db: Session
):

    applications = (

        db.query(
            models.Swipe
        )
        .filter(
            models.Swipe.action == "Interested"
        )
        .all()
    )


    changed = False


    recruiters = (

        db.query(
            models.User
        )
        .filter(
            func.lower(
                models.User.role
            ) == "recruiter"
        )
        .all()
    )


    for application in applications:

        job = (

            db.query(
                models.Job
            )
            .filter(
                models.Job.id ==
                application.job_id
            )
            .first()
        )


        if job is None:

            continue


        # -------------------------------------------------
        # APPLICATION SUBMITTED
        # -------------------------------------------------

        submitted_title = (
            "📩 Application Submitted"
        )


        submitted_message = (

            f"Your application for "
            f"{job.title} at "
            f"{job.company} "
            f"has been submitted successfully."
        )


        if add_notification_if_missing(

            db,

            application.username,

            submitted_title,

            submitted_message

        ):

            changed = True


        # -------------------------------------------------
        # ACCEPTED
        # -------------------------------------------------

        if application.status == "Accepted":

            title = (
                "🎉 Application Accepted"
            )


            message = (

                f"Your application for "
                f"{job.title} at "
                f"{job.company} "
                f"has been accepted."
            )


            if add_notification_if_missing(

                db,

                application.username,

                title,

                message

            ):

                changed = True


        # -------------------------------------------------
        # REJECTED
        # -------------------------------------------------

        elif application.status == "Rejected":

            title = (
                "Application Update"
            )


            message = (

                f"Your application for "
                f"{job.title} at "
                f"{job.company} "
                f"was not selected."
            )


            if add_notification_if_missing(

                db,

                application.username,

                title,

                message

            ):

                changed = True


        # -------------------------------------------------
        # PENDING
        # -------------------------------------------------

        else:

            recruiter_title = (
                "👤 New Application Received"
            )


            recruiter_message = (

                f"{application.username} "
                f"applied for "
                f"{job.title} at "
                f"{job.company}."
            )


            for recruiter in recruiters:

                if add_notification_if_missing(

                    db,

                    recruiter.username,

                    recruiter_title,

                    recruiter_message

                ):

                    changed = True


    if changed:

        db.commit()


# =========================================================
# STARTUP
# =========================================================

@app.on_event(
    "startup"
)
def startup():

    db = SessionLocal()

    try:

        # This is important.
        # It creates notifications for applications
        # that already existed before the notification
        # system was fixed.

        backfill_application_notifications(
            db
        )

    finally:

        db.close()


# =========================================================
# HOME
# =========================================================

@app.get("/")
def home():

    return {
        "message":
            "Welcome to SwipeX Backend"
    }


# =========================================================
# REGISTER
# =========================================================

@app.post("/register")
def register(
    user: schemas.UserCreate,
    db: Session = Depends(get_db)
):

    existing_user = (

        db.query(
            models.User
        )
        .filter(
            models.User.email ==
            user.email
        )
        .first()
    )


    if existing_user:

        raise HTTPException(

            status_code=400,

            detail="Email already exists"
        )


    new_user = models.User(

        username=user.username,

        email=user.email,

        password=user.password,

        role=user.role
    )


    db.add(
        new_user
    )


    db.commit()


    db.refresh(
        new_user
    )


    return {

        "message":
            "Registration Successful",

        "username":
            new_user.username,

        "role":
            new_user.role
    }


# =========================================================
# LOGIN
# =========================================================

@app.post("/login")
def login(
    user: schemas.UserLogin,
    db: Session = Depends(get_db)
):

    existing_user = (

        db.query(
            models.User
        )
        .filter(

            models.User.email ==
            user.email,

            models.User.password ==
            user.password

        )
        .first()
    )


    if existing_user is None:

        raise HTTPException(

            status_code=401,

            detail=
                "Invalid Email or Password"
        )


    return {

        "message":
            "Login Successful",

        "username":
            existing_user.username,

        "role":
            existing_user.role
    }


# =========================================================
# SWIPE / APPLICATION
# =========================================================

@app.post("/swipe")
def swipe_job(

    swipe: schemas.SwipeCreate,

    db: Session = Depends(get_db)

):

    # =====================================================
    # APPLICATION
    # =====================================================

    if swipe.action == "Interested":

        existing_application = (

            db.query(
                models.Swipe
            )
            .filter(

                models.Swipe.username ==
                swipe.username,

                models.Swipe.job_id ==
                swipe.job_id,

                models.Swipe.action ==
                "Interested"

            )
            .first()
        )


        if existing_application:

            return {

                "message":
                    "Application already exists",

                "status":
                    existing_application.status
            }


        new_swipe = models.Swipe(

            username=
                swipe.username,

            job_id=
                swipe.job_id,

            action=
                "Interested",

            status=
                "Pending"
        )


        db.add(
            new_swipe
        )


        db.commit()


        db.refresh(
            new_swipe
        )


        job = (

            db.query(
                models.Job
            )
            .filter(
                models.Job.id ==
                swipe.job_id
            )
            .first()
        )


        if job:

            # ---------------------------------------------
            # JOB SEEKER NOTIFICATION
            # ---------------------------------------------

            add_notification_if_missing(

                db,

                swipe.username,

                "📩 Application Submitted",

                (
                    f"Your application for "
                    f"{job.title} at "
                    f"{job.company} "
                    f"has been submitted successfully."
                )
            )


            # ---------------------------------------------
            # RECRUITER NOTIFICATION
            # ---------------------------------------------

            recruiters = (

                db.query(
                    models.User
                )
                .filter(
                    func.lower(
                        models.User.role
                    ) == "recruiter"
                )
                .all()
            )


            for recruiter in recruiters:

                add_notification_if_missing(

                    db,

                    recruiter.username,

                    "👤 New Application Received",

                    (
                        f"{swipe.username} "
                        f"applied for "
                        f"{job.title} at "
                        f"{job.company}."
                    )
                )


            db.commit()


        return {

            "message":
                "Application submitted successfully",

            "status":
                "Pending"
        }


    # =====================================================
    # OTHER SWIPE ACTIONS
    # =====================================================

    new_swipe = models.Swipe(

        username=
            swipe.username,

        job_id=
            swipe.job_id,

        action=
            swipe.action,

        status=
            "Not Applied"
    )


    db.add(
        new_swipe
    )


    db.commit()


    db.refresh(
        new_swipe
    )


    return {

        "message":
            "Swipe Saved Successfully"
    }


# =========================================================
# LIKED JOBS
# =========================================================

@app.get(
    "/liked-jobs/{username}"
)
def liked_jobs(

    username: str,

    db: Session = Depends(get_db)

):

    return (

        db.query(
            models.Swipe
        )
        .filter(

            models.Swipe.username ==
            username,

            models.Swipe.action ==
            "Interested"

        )
        .all()
    )


# =========================================================
# CREATE JOB
# =========================================================

@app.post("/jobs")
def create_job(

    job: schemas.JobCreate,

    db: Session = Depends(get_db)

):

    new_job = models.Job(

        company=
            job.company,

        title=
            job.title,

        location=
            job.location,

        salary=
            job.salary,

        experience=
            job.experience,

        description=
            job.description
    )


    db.add(
        new_job
    )


    db.commit()


    db.refresh(
        new_job
    )


    return {

        "message":
            "Job Added Successfully",

        "id":
            new_job.id
    }


# =========================================================
# GET JOBS
# =========================================================

@app.get(
    "/jobs",
    response_model=list[
        schemas.JobResponse
    ]
)
def get_jobs(

    db: Session = Depends(get_db)

):

    jobs = (

        db.query(
            models.Job
        )
        .order_by(
            models.Job.id
        )
        .all()
    )


    result = []


    for job in jobs:

        swipes = (

            db.query(
                models.Swipe.username
            )
            .filter(

                models.Swipe.job_id ==
                job.id,

                models.Swipe.action ==
                "Interested"

            )
            .distinct()
            .all()
        )


        applicant_count = len(
            swipes
        )


        if applicant_count <= 3:

            competition = "Low"

        elif applicant_count <= 10:

            competition = "Medium"

        else:

            competition = "High"


        result.append({

            "id":
                job.id,

            "company":
                job.company,

            "title":
                job.title,

            "location":
                job.location,

            "salary":
                job.salary,

            "experience":
                job.experience,

            "description":
                job.description,

            "applicant_count":
                applicant_count,

            "competition":
                competition,

            "early_applicant":
                applicant_count <= 3,

            "recently_posted":
                True

        })


    return result


# =========================================================
# APPLICANTS
# =========================================================

@app.get("/applicants")
def get_applicants(

    db: Session = Depends(get_db)

):

    swipes = (

        db.query(
            models.Swipe
        )
        .filter(
            models.Swipe.action ==
            "Interested"
        )
        .order_by(
            models.Swipe.id.desc()
        )
        .all()
    )


    applicants = []


    seen = set()


    for swipe in swipes:

        application_key = (

            swipe.username,

            swipe.job_id
        )


        if application_key in seen:

            continue


        seen.add(
            application_key
        )


        user = (

            db.query(
                models.User
            )
            .filter(
                models.User.username ==
                swipe.username
            )
            .first()
        )


        job = (

            db.query(
                models.Job
            )
            .filter(
                models.Job.id ==
                swipe.job_id
            )
            .first()
        )


        if not job:

            continue


        resume = (

            db.query(
                models.Resume
            )
            .filter(
                models.Resume.username ==
                swipe.username
            )
            .order_by(
                models.Resume.id.desc()
            )
            .first()
        )


        applicants.append({

            "application_id":
                swipe.id,

            "username":
                swipe.username,

            "email":
                user.email
                if user
                else
                "Not available",

            "job_id":
                job.id,

            "job":
                job.title,

            "company":
                job.company,

            "location":
                job.location,

            "resume":
                resume.filename
                if resume
                else None,

            "status":
                swipe.status
                or "Pending"

        })


    return applicants

# =========================================================
# GET JOB SEEKER APPLICATIONS
# =========================================================

@app.get("/applications/{username}")
def get_user_applications(
    username: str,
    db: Session = Depends(get_db)
):

    applications = (

        db.query(
            models.Swipe
        )

        .filter(

            models.Swipe.username ==
                username,

            models.Swipe.action ==
                "Interested"

        )

        .order_by(
            models.Swipe.id.desc()
        )

        .all()

    )


    result = []


    for application in applications:


        job = (

            db.query(
                models.Job
            )

            .filter(
                models.Job.id ==
                    application.job_id
            )

            .first()

        )


        if not job:

            continue


        result.append({

            "application_id":
                application.id,

            "id":
                job.id,

            "job_id":
                job.id,

            "title":
                job.title,

            "company":
                job.company,

            "location":
                job.location,

            "salary":
                job.salary,

            "experience":
                job.experience,

            "description":
                job.description,

            "status":
                application.status
                or "Pending"

        })


    return result

# =========================================================
# ANALYZE RESUME
# =========================================================

@app.post("/analyze-resume")
async def analyze_resume(
    username: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):

    # =====================================================
    # VALIDATE FILE
    # =====================================================

    if not file.filename:

        raise HTTPException(
            status_code=400,
            detail="No file selected"
        )


    if not file.filename.lower().endswith(".pdf"):

        raise HTTPException(
            status_code=400,
            detail="Only PDF resumes are supported"
        )


    # =====================================================
    # SAFE FILE NAME
    # =====================================================

    safe_filename = os.path.basename(
        file.filename
    )


    file_path = os.path.join(
        UPLOAD_FOLDER,
        safe_filename
    )


    # =====================================================
    # SAVE FILE
    # =====================================================

    try:

        with open(
            file_path,
            "wb"
        ) as buffer:

            shutil.copyfileobj(
                file.file,
                buffer
            )

    except Exception as error:

        print(
            "File save error:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to save resume"
        )


    # =====================================================
    # SAVE RESUME TO DATABASE
    # =====================================================

    try:

        resume = models.Resume(

            username=username,

            filename=safe_filename,

            filepath=file_path
        )


        db.add(
            resume
        )


        db.commit()


        db.refresh(
            resume
        )

    except Exception as error:

        db.rollback()


        print(
            "Resume database error:",
            error
        )


    # =====================================================
    # EXTRACT RESUME TEXT
    # =====================================================

    try:

        text = extract_text(
            file_path
        )

    except Exception as error:

        print(
            "Resume text extraction error:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to analyze resume"
        )


    if not text:

        raise HTTPException(
            status_code=400,
            detail="Could not extract text from the PDF"
        )


    # =====================================================
    # EXTRACT SKILLS
    # =====================================================

    resume_skills = extract_skills(
        text
    )


    print(
        "================================"
    )

    print(
        "RESUME SKILLS:",
        resume_skills
    )


    # =====================================================
    # ATS SCORE
    # =====================================================

    score = ats_score(
        resume_skills
    )


    print(
        "ATS SCORE:",
        score
    )


    # =====================================================
    # LOAD JOBS
    # =====================================================

    jobs = (

        db.query(
            models.Job
        )

        .order_by(
            models.Job.id
        )

        .all()

    )


    recommendations = []


    best_match = 0

    best_matched = []

    best_missing = []


    # =====================================================
    # ANALYZE JOB MATCHES
    # =====================================================

    for job in jobs:


        job_text = (

            (job.title or "")

            + " "

            + (job.description or "")

        ).lower()


        job_skills = extract_skills(
            job_text
        )


        result = match_resume(

            job_skills,

            resume_skills

        )


        print(
            "================================"
        )

        print(
            "JOB:",
            job.title
        )

        print(
            "COMPANY:",
            job.company
        )

        print(
            "JOB SKILLS:",
            job_skills
        )

        print(
            "RESUME SKILLS:",
            resume_skills
        )

        print(
            "MATCH RESULT:",
            result
        )


        # =================================================
        # BEST MATCH
        # =================================================

        if (
            result["match"] >
            best_match
        ):

            best_match = (
                result["match"]
            )

            best_matched = (
                result["matched"]
            )

            best_missing = (
                result["missing"]
            )


        # =================================================
        # RECOMMENDATION
        # =================================================

        recommendations.append({

            "id":
                job.id,

            "job":
                job.title,

            "title":
                job.title,

            "company":
                job.company,

            "location":
                job.location,

            "salary":
                job.salary,

            "experience":
                job.experience,

            "description":
                job.description,

            "match":
                result["match"],

            "match_percentage":
                result["match"],

            "matched_skills":
                result["matched"],

            "missing_skills":
                result["missing"]

        })


    # =====================================================
    # SUGGESTIONS
    # =====================================================

    suggestions = generate_suggestions(

        best_missing,

        resume_skills,

        score

    )


    # =====================================================
    # SORT RECOMMENDATIONS
    # =====================================================

    recommendations.sort(

        key=lambda item:
            item["match"],

        reverse=True

    )


    # =====================================================
    # RESUME ANALYSIS NOTIFICATION
    # =====================================================

    add_notification_if_missing(

        db,

        username,

        "📄 Resume Analysis Completed",

        (
            "Your resume has been analyzed successfully. "
            f"Best job match: {best_match}%."
        )

    )


    # =====================================================
    # HIGH MATCH NOTIFICATIONS
    # =====================================================

    for recommendation in recommendations[:3]:

        if (
            recommendation["match"] >= 70
        ):

            add_notification_if_missing(

                db,

                username,

                "🎯 High Match Job Found",

                (
                    f'{recommendation["job"]} at '
                    f'{recommendation["company"]} '
                    f'matches your resume by '
                    f'{recommendation["match"]}%.'
                )

            )


    db.commit()


    # =====================================================
    # RESPONSE
    # =====================================================

    return {

        "filename":
            safe_filename,

        "ats_score":
            score,

        "skills":
            resume_skills,

        "match_percentage":
            best_match,

        "matched_skills":
            best_matched,

        "missing_skills":
            best_missing,

        "suggestions":
            suggestions,

        "recommendations":
            recommendations

    }

# =========================================================
# NOTIFICATIONS
# =========================================================

@app.post("/notifications")
def create_notification(

    username: str,

    title: str,

    message: str,

    db: Session = Depends(get_db)

):

    notification = models.Notification(

        username=
            username,

        title=
            title,

        message=
            message,

        is_read=
            False
    )


    db.add(
        notification
    )


    db.commit()


    db.refresh(
        notification
    )


    return {

        "message":
            "Notification created successfully",

        "notification_id":
            notification.id
    }


# =========================================================
# GET NOTIFICATIONS
# =========================================================

@app.get(
    "/notifications/{username}"
)
def get_notifications(

    username: str,

    db: Session = Depends(get_db)

):

    notifications = (

        db.query(
            models.Notification
        )
        .filter(
            models.Notification.username ==
            username
        )
        .order_by(
            models.Notification.created_at.desc()
        )
        .all()
    )


    return notifications


# =========================================================
# UNREAD COUNT
# =========================================================

@app.get(
    "/notifications/{username}/unread-count"
)
def unread_notification_count(

    username: str,

    db: Session = Depends(get_db)

):

    count = (

        db.query(
            models.Notification
        )
        .filter(

            models.Notification.username ==
            username,

            models.Notification.is_read ==
            False

        )
        .count()
    )


    return {

        "unread_count":
            count
    }


# =========================================================
# MARK ONE READ
# =========================================================

@app.put(
    "/notifications/{notification_id}/read"
)
def mark_notification_read(

    notification_id: int,

    db: Session = Depends(get_db)

):

    notification = (

        db.query(
            models.Notification
        )
        .filter(
            models.Notification.id ==
            notification_id
        )
        .first()
    )


    if notification is None:

        raise HTTPException(

            status_code=404,

            detail=
                "Notification not found"
        )


    notification.is_read = True


    db.commit()


    return {

        "message":
            "Notification marked as read"
    }


# =========================================================
# MARK ALL READ
# =========================================================

@app.put(
    "/notifications/{username}/read-all"
)
def mark_all_notifications_read(

    username: str,

    db: Session = Depends(get_db)

):

    notifications = (

        db.query(
            models.Notification
        )
        .filter(

            models.Notification.username ==
            username,

            models.Notification.is_read ==
            False

        )
        .all()
    )


    for notification in notifications:

        notification.is_read = True


    db.commit()


    return {

        "message":
            "All notifications marked as read"
    }


# =========================================================
# ACCEPT APPLICATION
# =========================================================

@app.put(
    "/applications/{application_id}/accept"
)
def accept_application(

    application_id: int,

    db: Session = Depends(get_db)

):

    application = (

        db.query(
            models.Swipe
        )
        .filter(

            models.Swipe.id ==
            application_id,

            models.Swipe.action ==
            "Interested"

        )
        .first()
    )


    if application is None:

        raise HTTPException(

            status_code=404,

            detail=
                "Application not found"
        )


    already_accepted = (

        application.status ==
        "Accepted"
    )


    # -----------------------------------------------------
    # ALWAYS SET ACCEPTED
    # -----------------------------------------------------

    application.status = "Accepted"


    job = (

        db.query(
            models.Job
        )
        .filter(
            models.Job.id ==
            application.job_id
        )
        .first()
    )


    if job:

        # -------------------------------------------------
        # THIS IS THE IMPORTANT FIX
        # -------------------------------------------------
        # Even if the application was already Accepted,
        # make sure the job seeker has the notification.

        add_notification_if_missing(

            db,

            application.username,

            "🎉 Application Accepted",

            (
                f"Your application for "
                f"{job.title} at "
                f"{job.company} "
                f"has been accepted."
            )
        )


    db.commit()


    return {

        "message":

            (
                "Application already accepted"
                if already_accepted

                else
                "Application accepted successfully"
            ),

        "status":
            "Accepted"
    }


# =========================================================
# REJECT APPLICATION
# =========================================================

@app.put(
    "/applications/{application_id}/reject"
)
def reject_application(

    application_id: int,

    db: Session = Depends(get_db)

):

    application = (

        db.query(
            models.Swipe
        )
        .filter(

            models.Swipe.id ==
            application_id,

            models.Swipe.action ==
            "Interested"

        )
        .first()
    )


    if application is None:

        raise HTTPException(

            status_code=404,

            detail=
                "Application not found"
        )


    already_rejected = (

        application.status ==
        "Rejected"
    )


    application.status = "Rejected"


    job = (

        db.query(
            models.Job
        )
        .filter(
            models.Job.id ==
            application.job_id
        )
        .first()
    )


    if job:

        add_notification_if_missing(

            db,

            application.username,

            "Application Update",

            (
                f"Your application for "
                f"{job.title} at "
                f"{job.company} "
                f"was not selected."
            )
        )


    db.commit()


    return {

        "message":

            (
                "Application already rejected"
                if already_rejected

                else
                "Application rejected"
            ),

        "status":
            "Rejected"
    }


# =========================================================
# DELETE JOB
# =========================================================

@app.delete(
    "/jobs/{job_id}"
)
def delete_job(

    job_id: int,

    db: Session = Depends(get_db)

):

    job = (

        db.query(
            models.Job
        )
        .filter(
            models.Job.id ==
            job_id
        )
        .first()
    )


    if job is None:

        raise HTTPException(

            status_code=404,

            detail=
                "Job not found"
        )


    db.query(
        models.Swipe
    ).filter(
        models.Swipe.job_id ==
        job_id
    ).delete(
        synchronize_session=False
    )


    db.delete(
        job
    )


    db.commit()


    return {

        "message":
            "Job deleted successfully"
    }
    
# =========================================================
# DELETE ONE NOTIFICATION
# =========================================================

@app.delete("/notifications/{notification_id}")
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db)
):

    notification = (
        db.query(models.Notification)
        .filter(
            models.Notification.id == notification_id
        )
        .first()
    )

    if notification is None:

        raise HTTPException(
            status_code=404,
            detail="Notification not found"
        )

    db.delete(notification)

    db.commit()

    return {
        "message": "Notification deleted successfully"
    }