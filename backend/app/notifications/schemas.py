from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    type: str # match, application, alert, system
    is_read: bool
    job_id: Optional[int] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
