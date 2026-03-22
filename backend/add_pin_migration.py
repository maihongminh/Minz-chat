#!/usr/bin/env python3
"""
Migration script to add pin message feature
Adds is_pinned, pinned_at, and pinned_by_user_id columns to messages table
"""

import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("❌ ERROR: DATABASE_URL not found in environment variables")
    sys.exit(1)

print("🔧 Starting migration: Add pin columns to messages table")
print(f"📊 Database: {DATABASE_URL.split('@')[1] if '@' in DATABASE_URL else 'localhost'}")

try:
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        print("\n📝 Adding pin columns to messages table...")
        
        # Add is_pinned column
        conn.execute(text("""
            ALTER TABLE messages 
            ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE
        """))
        conn.commit()
        print("✅ Added is_pinned column")
        
        # Add pinned_at column
        conn.execute(text("""
            ALTER TABLE messages 
            ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMP
        """))
        conn.commit()
        print("✅ Added pinned_at column")
        
        # Add pinned_by_user_id column
        conn.execute(text("""
            ALTER TABLE messages 
            ADD COLUMN IF NOT EXISTS pinned_by_user_id INTEGER REFERENCES users(id)
        """))
        conn.commit()
        print("✅ Added pinned_by_user_id column")
        
        # Create index for performance
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_messages_is_pinned 
            ON messages(is_pinned)
        """))
        conn.commit()
        print("✅ Created index on is_pinned column")
        
        # Verify columns exist
        print("\n🔍 Verifying migration...")
        result = conn.execute(text("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'messages' 
            AND column_name IN ('is_pinned', 'pinned_at', 'pinned_by_user_id')
            ORDER BY column_name
        """))
        
        columns = result.fetchall()
        if len(columns) == 3:
            print("✅ Migration verification successful!")
            print("\n📋 New columns:")
            for col in columns:
                print(f"   - {col[0]}: {col[1]} (nullable: {col[2]}, default: {col[3]})")
        else:
            print(f"⚠️  Warning: Expected 3 columns, found {len(columns)}")
        
    print("\n✅ Migration completed successfully!")
    print("🎉 Pin message feature is now ready to use!")
    
except Exception as e:
    print(f"\n❌ Migration failed: {e}")
    sys.exit(1)
