-- Migration: Add is_automated flag to messages
-- Phase 4.3: Guardrailed Auto-Replies

ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_automated BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_messages_is_automated ON messages(is_automated);

-- Add auto_reply_cooldown_seconds to automation_rules
ALTER TABLE automation_rules ADD COLUMN IF NOT EXISTS auto_reply_cooldown_seconds INTEGER DEFAULT 300; -- 5 minutes default

