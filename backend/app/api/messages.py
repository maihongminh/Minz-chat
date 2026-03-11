from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from ..core import get_db
from ..models import User, Message, Room
from ..models.message import message_reads
from ..schemas import MessageCreate, MessageResponse, MessageWithSender
from .auth import get_current_user

router = APIRouter(prefix="/messages", tags=["Messages"])

@router.post("/", response_model=MessageResponse)
async def send_message(
    message_data: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Validate: must have either room_id or receiver_id
    if not message_data.room_id and not message_data.receiver_id:
        raise HTTPException(status_code=400, detail="Must specify either room_id or receiver_id")
    
    if message_data.room_id and message_data.receiver_id:
        raise HTTPException(status_code=400, detail="Cannot specify both room_id and receiver_id")
    
    is_private = message_data.receiver_id is not None
    
    # Create message
    new_message = Message(
        content=message_data.content,
        sender_id=current_user.id,
        room_id=message_data.room_id,
        receiver_id=message_data.receiver_id,
        is_private=is_private
    )
    
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    
    return new_message

@router.get("/room/{room_id}", response_model=List[MessageWithSender])
async def get_room_messages(
    room_id: int,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    messages = db.query(Message).filter(
        Message.room_id == room_id,
        Message.is_deleted == False
    ).order_by(Message.created_at.desc()).limit(limit).offset(offset).all()
    
    # Add sender info and read receipts
    result = []
    for msg in messages:
        sender = db.query(User).filter(User.id == msg.sender_id).first()
        
        # Get read receipts for this message
        read_by_users = db.execute(
            message_reads.select().where(message_reads.c.message_id == msg.id)
        ).fetchall()
        read_by_ids = [r.user_id for r in read_by_users]
        
        result.append({
            **msg.__dict__,
            "sender_username": sender.username if sender else "Unknown",
            "sender_avatar": sender.avatar_url if sender else None,
            "read_by": read_by_ids
        })
    
    return list(reversed(result))

@router.get("/private/{user_id}", response_model=List[MessageWithSender])
async def get_private_messages(
    user_id: int,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Get messages between current user and specified user
    messages = db.query(Message).filter(
        Message.is_private == True,
        Message.is_deleted == False,
        (
            ((Message.sender_id == current_user.id) & (Message.receiver_id == user_id)) |
            ((Message.sender_id == user_id) & (Message.receiver_id == current_user.id))
        )
    ).order_by(Message.created_at.desc()).limit(limit).offset(offset).all()
    
    # Add sender info and read receipts
    result = []
    for msg in messages:
        sender = db.query(User).filter(User.id == msg.sender_id).first()
        
        # Get read receipts for this message
        read_by_users = db.execute(
            message_reads.select().where(message_reads.c.message_id == msg.id)
        ).fetchall()
        read_by_ids = [r.user_id for r in read_by_users]
        
        result.append({
            **msg.__dict__,
            "sender_username": sender.username if sender else "Unknown",
            "sender_avatar": sender.avatar_url if sender else None,
            "read_by": read_by_ids
        })
    
    return list(reversed(result))
