import os
import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from ..database import get_db
from .. import schemas, crud, models
from .auth import get_current_user

router = APIRouter(prefix="/conversations", tags=["messaging"])

@router.post("", response_model=schemas.ConversationOut)
def create_or_get_conversation(
    payload: schemas.ConversationCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    job = crud.get_job_by_id(db, payload.job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if current_user.role == models.UserRole.job_seeker:
        job_seeker_id = current_user.id
        recruiter_id = job.recruiter_id
        # Verify candidate swiped right on this job
        swipe = db.query(models.Swipe).filter(
            models.Swipe.user_id == job_seeker_id,
            models.Swipe.job_id == job.id,
            models.Swipe.direction == models.SwipeDirection.right
        ).first()
        if not swipe:
            raise HTTPException(status_code=403, detail="You must swipe right / apply to this job before starting a conversation.")
    else:
        # Recruiter initiated conversation
        if not payload.job_seeker_id:
            raise HTTPException(status_code=400, detail="Job seeker ID is required for recruiter initiated chat.")
        recruiter_id = current_user.id
        job_seeker_id = payload.job_seeker_id

    conv = crud.get_or_create_conversation(db, job_seeker_id=job_seeker_id, recruiter_id=recruiter_id, job_id=job.id)

    # Format output fields
    company = db.query(models.Company).filter(models.Company.id == job.company_id).first()
    other_user_id = recruiter_id if current_user.id == job_seeker_id else job_seeker_id
    other_user = db.query(models.User).filter(models.User.id == other_user_id).first()

    return {
        "id": conv.id,
        "job_seeker_id": conv.job_seeker_id,
        "recruiter_id": conv.recruiter_id,
        "job_id": conv.job_id,
        "created_at": conv.created_at,
        "updated_at": conv.updated_at,
        "job_title": job.title,
        "company_name": company.name if company else "Hiring Company",
        "other_party_name": other_user.email.split("@")[0].capitalize() if other_user else "User",
        "last_message": conv.messages[-1].content if conv.messages else None,
        "unread_count": sum(1 for m in conv.messages if not m.is_read and m.sender_id != current_user.id)
    }

@router.get("", response_model=list[schemas.ConversationOut])
def list_user_conversations(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    convs = crud.get_user_conversations(db, current_user.id)
    result = []
    for conv in convs:
        job = crud.get_job_by_id(db, conv.job_id)
        company = db.query(models.Company).filter(models.Company.id == job.company_id).first() if job else None
        other_user_id = conv.recruiter_id if current_user.id == conv.job_seeker_id else conv.job_seeker_id
        other_user = db.query(models.User).filter(models.User.id == other_user_id).first()
        
        msgs = conv.messages or []
        last_msg = msgs[-1].content if msgs else "Conversation started"
        unread = sum(1 for m in msgs if not m.is_read and m.sender_id != current_user.id)

        result.append({
            "id": conv.id,
            "job_seeker_id": conv.job_seeker_id,
            "recruiter_id": conv.recruiter_id,
            "job_id": conv.job_id,
            "created_at": conv.created_at,
            "updated_at": conv.updated_at,
            "job_title": job.title if job else "Job Role",
            "company_name": company.name if company else "Company",
            "other_party_name": other_user.email.split("@")[0].capitalize() if other_user else "User",
            "last_message": last_msg,
            "unread_count": unread
        })
    return result

@router.get("/{conversation_id}/messages", response_model=list[schemas.MessageOut])
def get_messages(
    conversation_id: UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    conv = crud.get_conversation_by_id(db, conversation_id)
    if not conv or (conv.job_seeker_id != current_user.id and conv.recruiter_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to view this conversation.")

    crud.mark_conversation_read(db, conversation_id, current_user.id)
    return crud.get_conversation_messages(db, conversation_id)

@router.post("/{conversation_id}/messages", response_model=schemas.MessageOut)
async def send_message(
    conversation_id: UUID,
    payload: schemas.MessageCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    conv = crud.get_conversation_by_id(db, conversation_id)
    if not conv or (conv.job_seeker_id != current_user.id and conv.recruiter_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to message in this conversation.")

    if not payload.content or not payload.content.strip():
        raise HTTPException(status_code=400, detail="Message content cannot be empty.")

    msg = crud.create_message(db, conversation_id, current_user.id, payload.content.strip())

    # Create notification for the recipient
    recipient_id = conv.recruiter_id if current_user.id == conv.job_seeker_id else conv.job_seeker_id
    
    if current_user.role == models.UserRole.job_seeker and current_user.job_seeker_profile:
        sender_name = current_user.job_seeker_profile.full_name
    elif current_user.role == models.UserRole.recruiter and current_user.recruiter_profile:
        sender_name = current_user.recruiter_profile.company_name or current_user.recruiter_profile.full_name
    else:
        sender_name = "Someone"

    job = crud.get_job_by_id(db, conv.job_id)
    job_title = job.title if job else "a role"

    try:
        notif = crud.create_notification(
            db=db,
            user_id=recipient_id,
            type_str="info",
            title=f"New Message from {sender_name}",
            message=f"You have a new message regarding {job_title}.",
            link="/messages"
        )
        from ..services.notification_service import notification_manager
        from fastapi.encoders import jsonable_encoder
        notif_out = schemas.NotificationOut.model_validate(notif)
        await notification_manager.send_personal_notification(str(recipient_id), jsonable_encoder(notif_out))
    except Exception as e:
        print(f"Notification error: {e}")

    return msg

@router.patch("/{conversation_id}/read")
def mark_read(
    conversation_id: UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    crud.mark_conversation_read(db, conversation_id, current_user.id)
    return {"message": "Thread marked as read"}

@router.post("/{conversation_id}/ai-assist")
def ai_message_assist(
    conversation_id: UUID,
    mode: str = "smart_replies", # "smart_replies" | "polish_message"
    draft_content: str = "",
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    conv = crud.get_conversation_by_id(db, conversation_id)
    if not conv or (conv.job_seeker_id != current_user.id and conv.recruiter_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized.")

    job = crud.get_job_by_id(db, conv.job_id)
    job_title = job.title if job else "the position"
    gemini_key = os.getenv("GEMINI_API_KEY")

    if mode == "polish_message":
        if gemini_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=gemini_key)
                model = genai.GenerativeModel("gemini-2.0-flash")
                prompt = f"Rewrite this chat draft to sound professional and clear for a job application message: '{draft_content}'"
                res = model.generate_content(prompt)
                if res.text:
                    return {"polished_message": res.text.strip()}
            except Exception as e:
                print(f"AI assist polish error: {e}")
        return {"polished_message": f"Hello! I wanted to follow up on my application for the {job_title} role and check if you have any questions regarding my background. Thank you!"}

    else:
        # Generate 3 AI Smart Reply chips
        if gemini_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=gemini_key)
                model = genai.GenerativeModel("gemini-2.0-flash")
                prompt = f"Generate 3 short, professional quick-reply message chips for a candidate/recruiter chat regarding {job_title}. Return JSON array of strings."
                res = model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
                chips = json.loads(res.text)
                if isinstance(chips, list) and len(chips) >= 3:
                    return {"smart_replies": chips[:3]}
            except Exception as e:
                print(f"AI assist replies error: {e}")

        return {
            "smart_replies": [
                f"Hi! Thanks for reaching out about the {job_title} position.",
                "I would love to schedule a 15-minute screening call this week.",
                "Could you please share your GitHub or portfolio link?"
            ]
        }
