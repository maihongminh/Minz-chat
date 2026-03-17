#!/usr/bin/env python3
"""
Script to initialize database - creates all tables from SQLAlchemy models
"""
import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import engine, Base
from app.models.user import User
from app.models.room import Room, RoomMember
from app.models.message import Message, message_reads
from app.models.attachment import Attachment

def init_database():
    """Initialize database by creating all tables"""
    print("Initializing database...")
    print("Creating all tables from models...")
    
    try:
        # Create all tables
        Base.metadata.create_all(bind=engine)
        
        print("✓ Database initialized successfully!")
        print("✓ Tables created:")
        print("  - users")
        print("  - rooms")
        print("  - room_members")
        print("  - messages")
        print("  - message_reads")
        print("  - attachments")
        return True
    except Exception as e:
        print(f"✗ Error initializing database: {e}")
        return False

if __name__ == "__main__":
    success = init_database()
    sys.exit(0 if success else 1)
