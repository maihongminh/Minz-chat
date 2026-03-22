-- Migration: Add pin columns to messages table
-- Purpose: Enable pin message feature for rooms and private chats
-- Version: 2.1
-- Date: 2026-03-22

-- Add pin columns to messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS pinned_by_user_id INTEGER REFERENCES users(id);

-- Create index for faster pinned message queries
CREATE INDEX IF NOT EXISTS idx_messages_is_pinned ON messages(is_pinned);

-- Verify migration
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'messages' 
AND column_name IN ('is_pinned', 'pinned_at', 'pinned_by_user_id');
