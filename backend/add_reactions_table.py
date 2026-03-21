"""
Migration script to add message_reactions table
Run this once to add reactions feature to existing database
"""

from app.core.database import engine
from sqlalchemy import text

def add_reactions_table():
    """Add message_reactions table if it doesn't exist"""
    
    with engine.connect() as conn:
        # Check if table exists
        result = conn.execute(text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'message_reactions'
            );
        """))
        
        table_exists = result.scalar()
        
        if table_exists:
            print("ℹ️  Table message_reactions already exists")
            return
        
        # Create message_reactions table
        print("Creating message_reactions table...")
        conn.execute(text("""
            CREATE TABLE message_reactions (
                id SERIAL PRIMARY KEY,
                message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                emoji VARCHAR(10) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT unique_message_user_emoji UNIQUE (message_id, user_id, emoji)
            );
        """))
        
        # Create index on message_id for faster queries
        print("Creating index on message_id...")
        conn.execute(text("""
            CREATE INDEX idx_message_reactions_message_id ON message_reactions(message_id);
        """))
        
        conn.commit()
        
        print("✅ Table message_reactions created successfully!")
        print("✅ Index created on message_id")
        print("✅ Unique constraint added for (message_id, user_id, emoji)")

if __name__ == "__main__":
    try:
        add_reactions_table()
    except Exception as e:
        print(f"❌ Error: {e}")
        raise
