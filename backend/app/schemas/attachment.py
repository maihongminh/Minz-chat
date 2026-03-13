from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AttachmentBase(BaseModel):
    file_url: str
    file_name: str
    file_type: str
    file_size: Optional[int] = None

class AttachmentCreate(AttachmentBase):
    pass

class AttachmentResponse(AttachmentBase):
    id: int
    message_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True
