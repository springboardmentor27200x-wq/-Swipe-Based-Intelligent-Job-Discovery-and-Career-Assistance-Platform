from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from ..database import get_db
from .. import schemas, crud, models
from .auth import get_current_user

router = APIRouter(prefix="/swipes", tags=["swipes"])

@router.post("", response_model=schemas.SwipeOut, status_code=status.HTTP_201_CREATED)
def record_swipe(
    swipe_in: schemas.SwipeCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Verify job exists
    job = crud.get_job_by_id(db, swipe_in.job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    return crud.record_swipe(db, user_id=current_user.id, job_id=swipe_in.job_id, direction=swipe_in.direction)

@router.get("", response_model=List[schemas.SwipeOut])
def list_swipes(
    direction: Optional[models.SwipeDirection] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return crud.get_user_swipes(db, user_id=current_user.id, direction=direction)

@router.delete("", status_code=status.HTTP_200_OK)
def reset_swipes(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    crud.delete_user_swipes(db, user_id=current_user.id)
    return {"message": "All swipe history cleared successfully"}

@router.patch("/{swipe_id}/status", response_model=schemas.SwipeOut)
async def update_swipe_status(
    swipe_id: UUID,
    status_update: schemas.SwipeStatusUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    swipe = crud.update_swipe_status(db, swipe_id, status_update.status)
    if not swipe:
        raise HTTPException(status_code=404, detail="Swipe record not found")
    
    # Notify candidate if status updated by recruiter
    try:
        job = crud.get_job_by_id(db, swipe.job_id)
        job_title = job.title if job else "your application"
        status_readable = status_update.status.replace("_", " ").title()
        
        notif = crud.create_notification(
            db,
            user_id=swipe.user_id,
            type_str="application_status",
            title=f"Application Status Updated: {status_readable}",
            message=f"Your application status for '{job_title}' has been updated to {status_readable}."
        )
        from ..services.notification_service import notification_manager
        from fastapi.encoders import jsonable_encoder
        notif_out = schemas.NotificationOut.model_validate(notif)
        await notification_manager.send_personal_notification(str(swipe.user_id), jsonable_encoder(notif_out))
    except Exception as e:
        print(f"Notification error: {e}")

    return swipe

