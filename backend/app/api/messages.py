from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from ..core import get_db
from ..models import User, Message, Room, Attachment
from ..models.message import message_reads
from ..schemas import MessageCreate, MessageResponse, MessageWithSender
from .auth import get_current_user

router = APIRouter(prefix="/messages", tags=["Messages"])

def _build_message_response(msg: Message, db: Session):
    """Helper function to build message response with all related data"""
    sender = db.query(User).filter(User.id == msg.sender_id).first()
    
    # Get read receipts
    read_by_users = db.execute(
        message_reads.select().where(message_reads.c.message_id == msg.id)
    ).fetchall()
    read_by_ids = [r.user_id for r in read_by_users]
    
    # Get attachments
    attachments = db.query(Attachment).filter(Attachment.message_id == msg.id).all()
    attachments_data = [
        {
            "id": att.id,
            "message_id": att.message_id,
            "file_url": att.file_url,
            "file_name": att.file_name,
            "file_type": att.file_type,
            "file_size": att.file_size,
            "created_at": att.created_at.isoformat()
        }
        for att in attachments
    ]
    
    # Get reply_to message info if exists
    reply_to_data = None
    if hasattr(msg, 'reply_to_message_id') and msg.reply_to_message_id:
        reply_msg = db.query(Message).filter(Message.id == msg.reply_to_message_id).first()
        if reply_msg:
            reply_sender = db.query(User).filter(User.id == reply_msg.sender_id).first()
            reply_to_data = {
                "id": reply_msg.id,
                "content": reply_msg.content,
                "sender_id": reply_msg.sender_id,
                "sender_username": reply_sender.username if reply_sender else "Unknown",
                "created_at": reply_msg.created_at.isoformat() if reply_msg.created_at else None
            }
    
    # Get pinned_by username if message is pinned
    pinned_by_username = None
    if msg.is_pinned and msg.pinned_by_user_id:
        pinned_by_user = db.query(User).filter(User.id == msg.pinned_by_user_id).first()
        pinned_by_username = pinned_by_user.username if pinned_by_user else None
    
    return {
        **msg.__dict__,
        "sender_username": sender.username if sender else "Unknown",
        "sender_avatar": sender.avatar_url if sender else None,
        "read_by": read_by_ids,
        "attachments": attachments_data,
        "reply_to": reply_to_data,
        "pinned_by_username": pinned_by_username
    }

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
    
    # Build message responses with all related data
    result = [_build_message_response(msg, db) for msg in messages]
    
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
    
    # Build message responses with all related data
    result = [_build_message_response(msg, db) for msg in messages]
    
    return list(reversed(result))

@router.put("/{message_id}", response_model=MessageResponse)
async def edit_message(
    message_id: int,
    content: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Find the message
    message = db.query(Message).filter(Message.id == message_id).first()
    
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    # Only the sender can edit their message
    if message.sender_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only edit your own messages")
    
    # Update message
    message.content = content
    message.is_edited = True
    
    db.commit()
    db.refresh(message)
    
    return message

@router.delete("/{message_id}")
async def delete_message(
    message_id: int,
    delete_for_everyone: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Find the message
    message = db.query(Message).filter(Message.id == message_id).first()
    
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    # Only the sender can delete their message
    if message.sender_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own messages")
    
    if delete_for_everyone:
        # Mark as deleted for everyone
        message.is_deleted = True
        message.content = "This message was deleted"
        db.commit()
        return {"detail": "Message deleted for everyone", "delete_for_everyone": True, "message_id": message_id}
    else:
        # For "delete for me", we'll handle this on the frontend
        # by hiding the message, not actually deleting from DB
        return {"detail": "Message deleted for you", "delete_for_everyone": False, "message_id": message_id}

@router.post("/{message_id}/pin")
async def pin_message(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Pin a message in a room or private chat"""
    from datetime import datetime
    
    # Find the message
    message = db.query(Message).filter(Message.id == message_id).first()
    
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    # Check if message is already pinned
    if message.is_pinned:
        raise HTTPException(status_code=400, detail="Message is already pinned")
    
    # Check pinned message limit (max 5 per room/chat)
    if message.room_id:
        # For room messages
        pinned_count = db.query(Message).filter(
            Message.room_id == message.room_id,
            Message.is_pinned == True,
            Message.is_deleted == False
        ).count()
    else:
        # For private messages (between sender and receiver)
        pinned_count = db.query(Message).filter(
            Message.is_private == True,
            Message.is_pinned == True,
            Message.is_deleted == False,
            (
                ((Message.sender_id == message.sender_id) & (Message.receiver_id == message.receiver_id)) |
                ((Message.sender_id == message.receiver_id) & (Message.receiver_id == message.sender_id))
            )
        ).count()
    
    if pinned_count >= 5:
        raise HTTPException(
            status_code=400, 
            detail="Maximum 5 messages can be pinned. Please unpin a message first."
        )
    
    # Pin the message
    message.is_pinned = True
    message.pinned_at = datetime.utcnow()
    message.pinned_by_user_id = current_user.id
    
    db.commit()
    db.refresh(message)
    
    return {
        "detail": "Message pinned successfully",
        "message": _build_message_response(message, db)
    }

@router.delete("/{message_id}/pin")
async def unpin_message(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Unpin a message"""
    # Find the message
    message = db.query(Message).filter(Message.id == message_id).first()
    
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    if not message.is_pinned:
        raise HTTPException(status_code=400, detail="Message is not pinned")
    
    # Unpin the message
    message.is_pinned = False
    message.pinned_at = None
    message.pinned_by_user_id = None
    
    db.commit()
    db.refresh(message)
    
    return {
        "detail": "Message unpinned successfully",
        "message": _build_message_response(message, db)
    }

@router.get("/pinned/room/{room_id}")
async def get_pinned_messages_in_room(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all pinned messages in a room"""
    pinned_messages = db.query(Message).filter(
        Message.room_id == room_id,
        Message.is_pinned == True,
        Message.is_deleted == False
    ).order_by(Message.pinned_at.desc()).all()
    
    result = [_build_message_response(msg, db) for msg in pinned_messages]
    
    return {"pinned_messages": result, "count": len(result)}

@router.get("/pinned/private/{user_id}")
async def get_pinned_messages_in_private_chat(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all pinned messages in a private chat"""
    pinned_messages = db.query(Message).filter(
        Message.is_private == True,
        Message.is_pinned == True,
        Message.is_deleted == False,
        (
            ((Message.sender_id == current_user.id) & (Message.receiver_id == user_id)) |
            ((Message.sender_id == user_id) & (Message.receiver_id == current_user.id))
        )
    ).order_by(Message.pinned_at.desc()).all()
    
    result = [_build_message_response(msg, db) for msg in pinned_messages]
    
    return {"pinned_messages": result, "count": len(result)}
