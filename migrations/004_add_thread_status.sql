-- Migration: Add thread status, unread count, and assignment
-- Phase 2.2: Conversation State + Actions

-- Add status enum
DO $$ BEGIN
  CREATE TYPE thread_status AS ENUM ('open', 'pending', 'resolved', 'closed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add status column
ALTER TABLE threads ADD COLUMN IF NOT EXISTS status thread_status DEFAULT 'open';

-- Add unread_count
ALTER TABLE threads ADD COLUMN IF NOT EXISTS unread_count INTEGER DEFAULT 0;

-- Add last_read_at
ALTER TABLE threads ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMPTZ;

-- Add assigned_to (references auth.users)
ALTER TABLE threads ADD COLUMN IF NOT EXISTS assigned_to UUID;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_threads_status ON threads(status);
CREATE INDEX IF NOT EXISTS idx_threads_assigned_to ON threads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_threads_unread ON threads(unread_count) WHERE unread_count > 0;

