-- Migration: Add search indexes for thread search and filtering
-- Phase 2.1: Thread Search + Filtering

-- Add GIN index on messages.body for full-text search
CREATE INDEX IF NOT EXISTS idx_messages_body_gin ON messages USING gin(to_tsvector('english', body));

-- Add index on contacts.phone_e164 for phone number search
CREATE INDEX IF NOT EXISTS idx_contacts_phone_e164 ON contacts(phone_e164);

-- Add index on threads.last_message_at for sorting
CREATE INDEX IF NOT EXISTS idx_threads_last_message_at ON threads(last_message_at DESC);

