from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class RoomBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_private: bool = False

class RoomCreate(RoomBase):
    pass

class RoomResponse(RoomBase):
    id: int
    created_at: datetime
    member_count: Optional[int] = 0
    
    class Config:
        from_attributes = True

class RoomMemberResponse(BaseModel):
    id: int
    room_id: int
    user_id: int
    joined_at: datetime
    is_admin: bool
    username: str
    avatar_url: Optional[str] = None
    is_online: bool
    
    class Config:
        from_attributes = True
