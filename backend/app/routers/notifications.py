from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
import json

from ..database import get_db
from .. import schemas, crud, models
from ..auth import decode_token
from .auth import get_current_user
from ..services.notification_service import notification_manager

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

@router.get("", response_model=List[schemas.NotificationOut])
def get_user_notifications(
    limit: int = Query(30, ge=1, le=100),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetch recent notifications for the logged in user."""
    return crud.get_user_notifications(db, current_user.id, limit=limit)

@router.post("/mark-read/{notification_id}", response_model=schemas.NotificationOut)
def mark_notification_read(
    notification_id: UUID,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a specific notification as read."""
    notif = crud.mark_notification_read(db, notification_id, current_user.id)
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    return notif

@router.post("/mark-all-read")
def mark_all_notifications_read(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark all notifications for the user as read."""
    crud.mark_all_notifications_read(db, current_user.id)
    return {"status": "success", "message": "All notifications marked as read"}

@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """WebSocket endpoint for realtime notification updates."""
    if not token:
        await websocket.close(code=1008)
        return

    try:
        payload = decode_token(token)
        user_id = payload.get("sub") if payload else None
        if not user_id:
            await websocket.close(code=1008)
            return
    except Exception:
        await websocket.close(code=1008)
        return

    await notification_manager.connect(str(user_id), websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Heartbeat echo
            await websocket.send_text(json.dumps({"type": "pong", "payload": data}))
    except WebSocketDisconnect:
        notification_manager.disconnect(str(user_id), websocket)
