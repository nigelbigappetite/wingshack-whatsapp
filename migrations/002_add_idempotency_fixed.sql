-- Migration: Add idempotency protection
-- Phase 1.4: Idempotency + Duplicate Protection
-- FIXED VERSION: Handles existing duplicates

-- Step 1: Clean up any existing duplicates first
-- Keep the oldest message for each (provider_message_id, direction) pair
DELETE FROM messages m1
WHERE m1.provider_message_id IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM messages m2
    WHERE m2.provider_message_id = m1.provider_message_id
      AND m2.direction = m1.direction
      AND m2.id < m1.id  -- Keep the one with smaller ID (typically older)
  );

-- Step 2: Rename wa_message_id to provider_message_id (if column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'wa_message_id'
  ) THEN
    ALTER TABLE messages RENAME COLUMN wa_message_id TO provider_message_id;
  END IF;
END $$;

-- Step 3: Add idempotency_key to messages (if not exists)
ALTER TABLE messages ADD COLUMN IF NOT EXISTS idempotency_key UUID;
CREATE INDEX IF NOT EXISTS idx_messages_idempotency_key ON messages(idempotency_key);

-- Step 4: Add unique constraint on (provider_message_id, direction) for inbound messages
-- Only applies when provider_message_id is not null
-- This will fail if duplicates still exist - run cleanup script first if needed
CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_provider_unique 
  ON messages(provider_message_id, direction) 
  WHERE provider_message_id IS NOT NULL;

-- Step 5: Add unique constraint on outbox_jobs.message_id (one job per message)
CREATE UNIQUE INDEX IF NOT EXISTS idx_outbox_jobs_message_unique 
  ON outbox_jobs(message_id);

