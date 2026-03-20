#!/usr/bin/env python3
import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import engine, Base
from sqlalchemy import text, inspect

def add_reply_column():
    """Add reply_to_message_id column to messages table"""
    
    with engine.connect() as conn:
        # Check if column exists
        inspector = inspect(engine)
        columns = [col['name'] for col in inspector.get_columns('messages')]
        
        if 'reply_to_message_id' not in columns:
            print("Adding reply_to_message_id column...")
            conn.execute(text("ALTER TABLE messages ADD COLUMN reply_to_message_id INTEGER"))
            conn.commit()
            print("✅ Successfully added reply_to_message_id column")
        else:
            print("ℹ️  Column reply_to_message_id already exists")

if __name__ == "__main__":
    add_reply_column()
