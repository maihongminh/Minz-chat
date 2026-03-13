from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, BigInteger
from sqlalchemy.orm import relationship
from datetime import datetime
from ..core.database import Base

class Attachment(Base):
    __tablename__ = "attachments"
    
    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(Integer, ForeignKey("messages.id"), nullable=False)
    file_url = Column(Text, nullable=False)  # URL or base64 data for file
    file_name = Column(String(255), nullable=False)  # Original filename
    file_type = Column(String(100), nullable=False)  # MIME type (image/jpeg, application/pdf, etc.)
    file_size = Column(BigInteger, nullable=True)  # File size in bytes
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    message = relationship("Message", back_populates="attachments")
