from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from collections import defaultdict
from datetime import datetime

from ..core.database import get_db
from ..models import User, Message, MessageReaction
from ..schemas import ReactionCreate, ReactionResponse, ReactionSummary
from .auth import get_current_user
from ..services.websocket import manager

router = APIRouter(prefix="/reactions", tags=["reactions"])

ALLOWED_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"]

@router.post("/messages/{message_id}", response_model=ReactionResponse)
async def add_reaction(
    message_id: int,
    reaction: ReactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add or toggle a reaction to a message"""
    
    # Validate emoji
    if reaction.emoji not in ALLOWED_EMOJIS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid emoji. Allowed: {', '.join(ALLOWED_EMOJIS)}"
        )
    
    # Check if message exists
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    # Check if reaction already exists (toggle behavior)
    existing_reaction = db.query(MessageReaction).filter(
        MessageReaction.message_id == message_id,
        MessageReaction.user_id == current_user.id,
        MessageReaction.emoji == reaction.emoji
    ).first()
    
    if existing_reaction:
        # Remove reaction (toggle off)
        db.delete(existing_reaction)
        db.commit()
        
        # Broadcast reaction removal
        if message.room_id:
            # Broadcast to room
            await manager.broadcast_reaction(
                room_id=message.room_id,
                message_id=message_id,
                user_id=current_user.id,
                username=current_user.username,
                emoji=reaction.emoji,
                action="remove"
            )
        elif message.is_private and message.receiver_id:
            # Broadcast to both users in private chat
            reaction_data = {
                "type": "reaction",
                "action": "remove",
                "message_id": message_id,
                "user_id": current_user.id,
                "username": current_user.username,
                "emoji": reaction.emoji,
                "timestamp": datetime.utcnow().isoformat()
            }
            await manager.send_personal_message(reaction_data, message.sender_id)
            await manager.send_personal_message(reaction_data, message.receiver_id)
        
        raise HTTPException(
            status_code=status.HTTP_204_NO_CONTENT,
            detail="Reaction removed"
        )
    
    # Create new reaction
    new_reaction = MessageReaction(
        message_id=message_id,
        user_id=current_user.id,
        emoji=reaction.emoji
    )
    
    db.add(new_reaction)
    db.commit()
    db.refresh(new_reaction)
    
    # Broadcast reaction add
    if message.room_id:
        # Broadcast to room
        await manager.broadcast_reaction(
            room_id=message.room_id,
            message_id=message_id,
            user_id=current_user.id,
            username=current_user.username,
            emoji=reaction.emoji,
            action="add"
        )
    elif message.is_private and message.receiver_id:
        # Broadcast to both users in private chat
        reaction_data = {
            "type": "reaction",
            "action": "add",
            "message_id": message_id,
            "user_id": current_user.id,
            "username": current_user.username,
            "emoji": reaction.emoji,
            "timestamp": datetime.utcnow().isoformat()
        }
        await manager.send_personal_message(reaction_data, message.sender_id)
        await manager.send_personal_message(reaction_data, message.receiver_id)
    
    return ReactionResponse(
        id=new_reaction.id,
        message_id=new_reaction.message_id,
        user_id=new_reaction.user_id,
        username=current_user.username,
        emoji=new_reaction.emoji,
        created_at=new_reaction.created_at
    )

@router.delete("/messages/{message_id}/{emoji}")
async def remove_reaction(
    message_id: int,
    emoji: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove a specific reaction from a message"""
    
    reaction = db.query(MessageReaction).filter(
        MessageReaction.message_id == message_id,
        MessageReaction.user_id == current_user.id,
        MessageReaction.emoji == emoji
    ).first()
    
    if not reaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reaction not found"
        )
    
    db.delete(reaction)
    db.commit()
    
    return {"message": "Reaction removed"}

@router.get("/messages/{message_id}", response_model=List[ReactionSummary])
async def get_message_reactions(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all reactions for a message, grouped by emoji"""
    
    reactions = db.query(MessageReaction, User.username).join(
        User, MessageReaction.user_id == User.id
    ).filter(
        MessageReaction.message_id == message_id
    ).all()
    
    # Group by emoji
    grouped = defaultdict(lambda: {"users": [], "count": 0})
    
    for reaction, username in reactions:
        grouped[reaction.emoji]["users"].append(username)
        grouped[reaction.emoji]["count"] += 1
    
    # Build response
    result = []
    for emoji, data in grouped.items():
        result.append(ReactionSummary(
            emoji=emoji,
            count=data["count"],
            users=data["users"],
            user_reacted=current_user.username in data["users"]
        ))
    
    return result
