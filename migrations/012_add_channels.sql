-- Migration: Add channels model
-- Phase 6.1: Channels Model

-- Create channels table
CREATE TABLE IF NOT EXISTS channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add channel_id to existing tables
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS channel_id UUID REFERENCES channels(id);
ALTER TABLE threads ADD COLUMN IF NOT EXISTS channel_id UUID REFERENCES channels(id);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS channel_id UUID;
ALTER TABLE outbox_jobs ADD COLUMN IF NOT EXISTS channel_id UUID REFERENCES channels(id);

-- Create default channel and migrate existing data
DO $$
DECLARE
  default_channel_id UUID;
BEGIN
  -- Create default channel
  INSERT INTO channels (id, name, whatsapp_number)
  VALUES (gen_random_uuid(), 'Default', 'default')
  ON CONFLICT DO NOTHING
  RETURNING id INTO default_channel_id;

  -- If no default channel exists, get it
  IF default_channel_id IS NULL THEN
    SELECT id INTO default_channel_id FROM channels WHERE name = 'Default' LIMIT 1;
  END IF;

  -- Migrate existing data to default channel
  IF default_channel_id IS NOT NULL THEN
    UPDATE contacts SET channel_id = default_channel_id WHERE channel_id IS NULL;
    UPDATE threads SET channel_id = default_channel_id WHERE channel_id IS NULL;
    UPDATE messages SET channel_id = (SELECT channel_id FROM threads WHERE threads.id = messages.thread_id) WHERE channel_id IS NULL;
    UPDATE outbox_jobs SET channel_id = (SELECT channel_id FROM threads WHERE threads.id = (SELECT thread_id FROM messages WHERE messages.id = outbox_jobs.message_id)) WHERE channel_id IS NULL;
  END IF;
END $$;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_contacts_channel_id ON contacts(channel_id);
CREATE INDEX IF NOT EXISTS idx_threads_channel_id ON threads(channel_id);
CREATE INDEX IF NOT EXISTS idx_messages_channel_id ON messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_outbox_jobs_channel_id ON outbox_jobs(channel_id);

