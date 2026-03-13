#!/usr/bin/env python3
"""
Script to apply database migration for attachments table
"""
import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.core.database import engine

def apply_migration():
    """Apply the attachments table migration"""
    print("Applying migration: Create attachments table...")
    
    sql_script = """
    -- Create attachments table for multiple file uploads
    CREATE TABLE IF NOT EXISTS attachments (
        id SERIAL PRIMARY KEY,
        message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
        file_url TEXT NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_type VARCHAR(100) NOT NULL,
        file_size BIGINT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Create index for faster queries
    CREATE INDEX IF NOT EXISTS idx_attachments_message_id ON attachments(message_id);
    """
    
    try:
        with engine.connect() as conn:
            # Execute the SQL script
            conn.execute(text(sql_script))
            conn.commit()
            print("✓ Migration applied successfully!")
            print("✓ Attachments table created")
            print("✓ Index created on message_id")
            return True
    except Exception as e:
        print(f"✗ Error applying migration: {e}")
        return False

if __name__ == "__main__":
    success = apply_migration()
    sys.exit(0 if success else 1)
