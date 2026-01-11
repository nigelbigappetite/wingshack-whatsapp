-- Migration: Add idempotency protection
-- Phase 1.4: Idempotency + Duplicate Protection
-- NOTE: If you get a duplicate key error, run 002_add_idempotency_cleanup.sql first

-- Step 1: Rename wa_message_id to provider_message_id (if column exists)
-- Do this FIRST so we can use the new column name in cleanup
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'wa_message_id'
  ) THEN
    ALTER TABLE messages RENAME COLUMN wa_message_id TO provider_message_id;
  END IF;
END $$;

-- Step 2: Clean up any existing duplicates
-- Keep the oldest message for each (provider_message_id, direction) pair
DELETE FROM messages m1
WHERE m1.provider_message_id IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM messages m2
    WHERE m2.provider_message_id = m1.provider_message_id
      AND m2.direction = m1.direction
      AND m2.created_at < m1.created_at  -- Keep the older one
  );

-- Step 3: Add idempotency_key to messages (if not exists)
ALTER TABLE messages ADD COLUMN IF NOT EXISTS idempotency_key UUID;
CREATE INDEX IF NOT EXISTS idx_messages_idempotency_key ON messages(idempotency_key);

-- Step 4: Add unique constraint on (provider_message_id, direction) for inbound messages
-- Only applies when provider_message_id is not null
CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_provider_unique 
  ON messages(provider_message_id, direction) 
  WHERE provider_message_id IS NOT NULL;

-- Step 5: Add unique constraint on outbox_jobs.message_id (one job per message)
CREATE UNIQUE INDEX IF NOT EXISTS idx_outbox_jobs_message_unique 
  ON outbox_jobs(message_id);