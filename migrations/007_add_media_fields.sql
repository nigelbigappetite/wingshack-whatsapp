-- Migration: Add media fields to messages
-- Phase 3.1: Receive Attachments

ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS mime_type TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_name TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS size_bytes INTEGER;

CREATE INDEX IF NOT EXISTS idx_messages_message_type ON messages(message_type);

