from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, Table
from sqlalchemy.orm import relationship
from datetime import datetime
from ..core.database import Base

# Association table for message read receipts
message_reads = Table(
    'message_reads',
    Base.metadata,
    Column('message_id', Integer, ForeignKey('messages.id'), primary_key=True),
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True),
    Column('read_at', DateTime, default=datetime.utcnow)
)

class Message(Base):
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=True)  # None for private messages
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # For private messages
    is_private = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    is_edited = Column(Boolean, default=False)
    is_deleted = Column(Boolean, default=False)
    reply_to_message_id = Column(Integer, ForeignKey("messages.id"), nullable=True)
    
    # Legacy file attachments (kept for backward compatibility)
    file_url = Column(Text, nullable=True)  # URL or base64 data for file
    file_name = Column(String(255), nullable=True)  # Original filename
    file_type = Column(String(100), nullable=True)  # MIME type (image/jpeg, application/pdf, etc.)
    
    # Relationships
    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_messages")
    room = relationship("Room", back_populates="messages")
    read_by = relationship("User", secondary=message_reads, backref="read_messages")
    attachments = relationship("Attachment", back_populates="message", cascade="all, delete-orphan")
    reactions = relationship("MessageReaction", back_populates="message", cascade="all, delete-orphan")
    
    # Reply relationship - self-referential
    reply_to = relationship("Message", remote_side=[id], foreign_keys=[reply_to_message_id])
