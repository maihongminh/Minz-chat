from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, List, Set
from datetime import datetime
import json
from sqlalchemy.orm import Session
from sqlalchemy import and_

from ..models import User, Message, Attachment
from ..models.message import message_reads
from ..core import decode_access_token

class ConnectionManager:
    def __init__(self):
        # user_id -> list of websocket connections
        self.active_connections: Dict[int, List[WebSocket]] = {}
        # room_id -> set of user_ids
        self.room_users: Dict[int, Set[int]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
    
    def disconnect(self, websocket: WebSocket, user_id: int):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
    
    def join_room(self, user_id: int, room_id: int):
        if room_id not in self.room_users:
            self.room_users[room_id] = set()
        self.room_users[room_id].add(user_id)
    
    def leave_room(self, user_id: int, room_id: int):
        if room_id in self.room_users:
            self.room_users[room_id].discard(user_id)
            if not self.room_users[room_id]:
                del self.room_users[room_id]
    
    async def send_personal_message(self, message: dict, user_id: int):
        """Send message to a specific user (all their connections)"""
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except:
                    pass
    
    async def send_room_message(self, message: dict, room_id: int):
        """Send message to all users in a room"""
        if room_id in self.room_users:
            for user_id in self.room_users[room_id]:
                await self.send_personal_message(message, user_id)
    
    async def broadcast_user_status(self, user_id: int, username: str, is_online: bool):
        """Broadcast user online/offline status to all connected users"""
        message = {
            "type": "user_status",
            "user_id": user_id,
            "username": username,
            "is_online": is_online,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Send to all connected users
        for uid in list(self.active_connections.keys()):
            await self.send_personal_message(message, uid)
    
    async def broadcast_room_deleted(self, room_id: int, room_name: str):
        """Broadcast room deletion to all connected users"""
        message = {
            "type": "room_deleted",
            "room_id": room_id,
            "room_name": room_name,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Send to all connected users
        for uid in list(self.active_connections.keys()):
            await self.send_personal_message(message, uid)
        
        # Clean up room_users
        if room_id in self.room_users:
            del self.room_users[room_id]
    
    def get_online_users(self) -> List[int]:
        """Get list of all online user IDs"""
        return list(self.active_connections.keys())
    
    def is_user_online(self, user_id: int) -> bool:
        """Check if a user is online"""
        return user_id in self.active_connections

# Global connection manager instance
manager = ConnectionManager()

async def authenticate_websocket(websocket: WebSocket, token: str, db: Session) -> User:
    """Authenticate WebSocket connection using JWT token"""
    if not token:
        await websocket.close(code=1008)
        return None
    
    payload = decode_access_token(token)
    if not payload:
        await websocket.close(code=1008)
        return None
    
    user_id = payload.get("sub")
    if not user_id:
        await websocket.close(code=1008)
        return None
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        await websocket.close(code=1008)
        return None
    
    return user

async def handle_websocket_message(data: dict, user: User, db: Session):
    """Handle incoming WebSocket messages"""
    message_type = data.get("type")
    
    if message_type == "chat_message":
        # Save message to database
        content = data.get("content", "")
        room_id = data.get("room_id")
        receiver_id = data.get("receiver_id")
        reply_to_message_id = data.get("reply_to_message_id")
        
        # File attachment data (legacy - single file)
        file_url = data.get("file_url")
        file_name = data.get("file_name")
        file_type = data.get("file_type")
        
        # Multiple attachments data
        attachments_data = data.get("attachments", [])
        
        # Message must have either content or file attachment
        if not content and not file_url and not attachments_data:
            return
        
        is_private = receiver_id is not None
        
        new_message = Message(
            content=content,
            sender_id=user.id,
            room_id=room_id,
            receiver_id=receiver_id,
            is_private=is_private,
            file_url=file_url,
            file_name=file_name,
            file_type=file_type,
            reply_to_message_id=reply_to_message_id
        )
        
        db.add(new_message)
        db.commit()
        db.refresh(new_message)
        
        # Create attachment records for multiple files
        attachment_objects = []
        if attachments_data:
            for att_data in attachments_data:
                attachment = Attachment(
                    message_id=new_message.id,
                    file_url=att_data.get("file_url"),
                    file_name=att_data.get("file_name"),
                    file_type=att_data.get("file_type"),
                    file_size=att_data.get("file_size")
                )
                db.add(attachment)
                attachment_objects.append(attachment)
            
            db.commit()
            for att in attachment_objects:
                db.refresh(att)
        
        # Prepare attachments for response
        attachments_response = [
            {
                "id": att.id,
                "message_id": att.message_id,
                "file_url": att.file_url,
                "file_name": att.file_name,
                "file_type": att.file_type,
                "file_size": att.file_size,
                "created_at": att.created_at.isoformat()
            }
            for att in attachment_objects
        ]
        
        # Get reply_to message info if exists
        reply_to_data = None
        if reply_to_message_id:
            reply_msg = db.query(Message).filter(Message.id == reply_to_message_id).first()
            if reply_msg:
                reply_sender = db.query(User).filter(User.id == reply_msg.sender_id).first()
                reply_to_data = {
                    "id": reply_msg.id,
                    "content": reply_msg.content,
                    "sender_id": reply_msg.sender_id,
                    "sender_username": reply_sender.username if reply_sender else "Unknown",
                    "created_at": reply_msg.created_at.isoformat() if reply_msg.created_at else None
                }
        
        # Prepare message to send
        message_data = {
            "type": "chat_message",
            "id": new_message.id,
            "content": new_message.content,
            "sender_id": user.id,
            "sender_username": user.username,
            "sender_avatar": user.avatar_url,
            "room_id": room_id,
            "receiver_id": receiver_id,
            "is_private": is_private,
            "created_at": new_message.created_at.isoformat(),
            "is_edited": False,
            "file_url": file_url,
            "file_name": file_name,
            "file_type": file_type,
            "attachments": attachments_response,
            "reply_to": reply_to_data
        }
        
        # Send to appropriate recipients
        if is_private and receiver_id:
            # Send to both sender and receiver
            await manager.send_personal_message(message_data, user.id)
            await manager.send_personal_message(message_data, receiver_id)
        elif room_id:
            # Send to all users in the room
            await manager.send_room_message(message_data, room_id)
    
    elif message_type == "join_room":
        room_id = data.get("room_id")
        if room_id:
            manager.join_room(user.id, room_id)
            
            # Notify room members
            notification = {
                "type": "user_joined_room",
                "user_id": user.id,
                "username": user.username,
                "room_id": room_id,
                "timestamp": datetime.utcnow().isoformat()
            }
            await manager.send_room_message(notification, room_id)
    
    elif message_type == "leave_room":
        room_id = data.get("room_id")
        if room_id:
            manager.leave_room(user.id, room_id)
            
            # Notify room members
            notification = {
                "type": "user_left_room",
                "user_id": user.id,
                "username": user.username,
                "room_id": room_id,
                "timestamp": datetime.utcnow().isoformat()
            }
            await manager.send_room_message(notification, room_id)
    
    elif message_type == "typing":
        room_id = data.get("room_id")
        receiver_id = data.get("receiver_id")
        is_typing = data.get("is_typing", False)
        
        typing_data = {
            "type": "typing",
            "user_id": user.id,
            "username": user.username,
            "is_typing": is_typing,
            "room_id": room_id,
            "receiver_id": receiver_id
        }
        
        if room_id:
            await manager.send_room_message(typing_data, room_id)
        elif receiver_id:
            await manager.send_personal_message(typing_data, receiver_id)
    
    elif message_type == "mark_as_read":
        message_ids = data.get("message_ids", [])
        
        if not message_ids:
            return
        
        # Mark messages as read
        for msg_id in message_ids:
            message = db.query(Message).filter(Message.id == msg_id).first()
            if message and message.sender_id != user.id:
                # Check if already marked as read
                existing = db.execute(
                    message_reads.select().where(
                        and_(
                            message_reads.c.message_id == msg_id,
                            message_reads.c.user_id == user.id
                        )
                    )
                ).first()
                
                if not existing:
                    # Insert read receipt
                    db.execute(
                        message_reads.insert().values(
                            message_id=msg_id,
                            user_id=user.id,
                            read_at=datetime.utcnow()
                        )
                    )
        
        db.commit()
        
        # Get read receipt info for each message
        read_receipts = []
        for msg_id in message_ids:
            message = db.query(Message).filter(Message.id == msg_id).first()
            if message:
                # Get all users who read this message
                read_by_users = db.execute(
                    message_reads.select().where(message_reads.c.message_id == msg_id)
                ).fetchall()
                
                read_by_ids = [r.user_id for r in read_by_users]
                
                read_receipts.append({
                    "message_id": msg_id,
                    "read_by": read_by_ids
                })
        
        # Send read receipt to message sender
        for msg_id in message_ids:
            message = db.query(Message).filter(Message.id == msg_id).first()
            if message:
                receipt_data = {
                    "type": "message_read",
                    "message_id": msg_id,
                    "user_id": user.id,
                    "username": user.username,
                    "room_id": message.room_id,
                    "read_at": datetime.utcnow().isoformat()
                }
                
                # Send to message sender
                await manager.send_personal_message(receipt_data, message.sender_id)
                
                # Also send to room members if it's a room message
                if message.room_id:
                    await manager.send_room_message(receipt_data, message.room_id)
    
    elif message_type == "edit_message":
        message_id = data.get("message_id")
        new_content = data.get("content")
        
        if not message_id or not new_content:
            return
        
        # Find and update the message
        message = db.query(Message).filter(Message.id == message_id).first()
        
        if not message:
            return
        
        # Only the sender can edit
        if message.sender_id != user.id:
            return
        
        # Update message
        message.content = new_content
        message.is_edited = True
        db.commit()
        db.refresh(message)
        
        # Prepare edit notification
        edit_data = {
            "type": "message_edited",
            "message_id": message_id,
            "content": new_content,
            "is_edited": True,
            "edited_at": datetime.utcnow().isoformat()
        }
        
        # Send to appropriate recipients
        if message.is_private and message.receiver_id:
            await manager.send_personal_message(edit_data, user.id)
            await manager.send_personal_message(edit_data, message.receiver_id)
        elif message.room_id:
            await manager.send_room_message(edit_data, message.room_id)
    
    elif message_type == "delete_message":
        message_id = data.get("message_id")
        delete_for_everyone = data.get("delete_for_everyone", False)
        
        if not message_id:
            return
        
        # Find the message
        message = db.query(Message).filter(Message.id == message_id).first()
        
        if not message:
            return
        
        # Only the sender can delete
        if message.sender_id != user.id:
            return
        
        # Prepare delete notification
        delete_data = {
            "type": "message_deleted",
            "message_id": message_id,
            "delete_for_everyone": delete_for_everyone
        }
        
        if delete_for_everyone:
            # Mark as deleted for everyone
            message.is_deleted = True
            message.content = "This message was deleted"
            db.commit()
            
            # Send to appropriate recipients
            if message.is_private and message.receiver_id:
                await manager.send_personal_message(delete_data, user.id)
                await manager.send_personal_message(delete_data, message.receiver_id)
            elif message.room_id:
                await manager.send_room_message(delete_data, message.room_id)
        else:
            # Delete for me only - just send to the user
            await manager.send_personal_message(delete_data, user.id)
