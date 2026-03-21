from pydantic import BaseModel
from typing import List
from datetime import datetime

class ReactionCreate(BaseModel):
    """Schema for creating a reaction"""
    emoji: str
    
class ReactionResponse(BaseModel):
    """Schema for reaction response"""
    id: int
    message_id: int
    user_id: int
    username: str  # For display
    emoji: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class ReactionSummary(BaseModel):
    """Summary of reactions for a message (grouped by emoji)"""
    emoji: str
    count: int
    users: List[str]  # List of usernames who reacted
    user_reacted: bool  # Whether current user has reacted with this emoji
