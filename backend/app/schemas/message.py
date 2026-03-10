from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class MessageBase(BaseModel):
    content: str

class MessageCreate(MessageBase):
    room_id: Optional[int] = None
    receiver_id: Optional[int] = None

class MessageResponse(MessageBase):
    id: int
    sender_id: int
    room_id: Optional[int] = None
    receiver_id: Optional[int] = None
    is_private: bool
    created_at: datetime
    is_edited: bool
    is_deleted: bool
    
    class Config:
        from_attributes = True

class MessageWithSender(MessageResponse):
    sender_username: str
    sender_avatar: Optional[str] = None
