from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..core import get_db
from ..models import User, Room, RoomMember
from ..schemas import RoomCreate, RoomResponse, RoomMemberResponse
from .auth import get_current_user

router = APIRouter(prefix="/rooms", tags=["Rooms"])

@router.post("/", response_model=RoomResponse)
async def create_room(
    room_data: RoomCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check if user has permission (only admin or super_admin)
    if not current_user.is_admin():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can create channels"
        )
    
    # Check if room name already exists
    existing_room = db.query(Room).filter(Room.name == room_data.name).first()
    if existing_room:
        raise HTTPException(status_code=400, detail="Room name already exists")
    
    # Create room
    new_room = Room(
        name=room_data.name,
        description=room_data.description,
        is_private=room_data.is_private
    )
    db.add(new_room)
    db.commit()
    db.refresh(new_room)
    
    # Add creator as admin member
    member = RoomMember(
        room_id=new_room.id,
        user_id=current_user.id,
        is_admin=True
    )
    db.add(member)
    db.commit()
    
    return new_room

@router.get("/", response_model=List[RoomResponse])
async def get_rooms(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rooms = db.query(Room).filter(Room.is_private == False).all()
    
    # Add member count
    result = []
    for room in rooms:
        room_dict = {
            "id": room.id,
            "name": room.name,
            "description": room.description,
            "is_private": room.is_private,
            "created_at": room.created_at,
            "member_count": len(room.members)
        }
        result.append(room_dict)
    
    return result

@router.get("/{room_id}", response_model=RoomResponse)
async def get_room(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    return room

@router.post("/{room_id}/join")
async def join_room(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    # Check if already a member
    existing_member = db.query(RoomMember).filter(
        RoomMember.room_id == room_id,
        RoomMember.user_id == current_user.id
    ).first()
    
    if existing_member:
        return {"message": "Already a member"}
    
    # Add member
    member = RoomMember(
        room_id=room_id,
        user_id=current_user.id,
        is_admin=False
    )
    db.add(member)
    db.commit()
    
    return {"message": "Joined room successfully"}

@router.post("/{room_id}/leave")
async def leave_room(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    member = db.query(RoomMember).filter(
        RoomMember.room_id == room_id,
        RoomMember.user_id == current_user.id
    ).first()
    
    if not member:
        raise HTTPException(status_code=404, detail="Not a member of this room")
    
    db.delete(member)
    db.commit()
    
    return {"message": "Left room successfully"}

@router.get("/{room_id}/members", response_model=List[RoomMemberResponse])
async def get_room_members(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    members = db.query(RoomMember).filter(RoomMember.room_id == room_id).all()
    
    result = []
    for member in members:
        user = db.query(User).filter(User.id == member.user_id).first()
        if user:
            result.append({
                "id": member.id,
                "room_id": member.room_id,
                "user_id": member.user_id,
                "joined_at": member.joined_at,
                "is_admin": member.is_admin,
                "username": user.username,
                "avatar_url": user.avatar_url,
                "is_online": user.is_online
            })
    
    return result

@router.delete("/{room_id}")
async def delete_room(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check if user has permission (only admin or super_admin)
    if not current_user.is_admin():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can delete channels"
        )
    
    # Get room
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    room_name = room.name
    
    # Delete all members first (foreign key constraint)
    db.query(RoomMember).filter(RoomMember.room_id == room_id).delete()
    
    # Delete all messages in the room
    from ..models import Message
    db.query(Message).filter(Message.room_id == room_id).delete()
    
    # Delete the room
    db.delete(room)
    db.commit()
    
    # Broadcast to all connected users
    from ..services.websocket import manager
    await manager.broadcast_room_deleted(room_id, room_name)
    
    return {"message": f"Channel '{room_name}' has been deleted"}
