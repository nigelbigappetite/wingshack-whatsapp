-- Migration: Add correlation IDs and request tracking
-- Phase 1.2: Structured Logging + Correlation IDs

-- Add request_id to messages table (for tracking webhook requests)
ALTER TABLE messages ADD COLUMN IF NOT EXISTS request_id UUID;
CREATE INDEX IF NOT EXISTS idx_messages_request_id ON messages(request_id);

-- Add correlation_id to outbox_jobs table (for tracking outbound processing)
ALTER TABLE outbox_jobs ADD COLUMN IF NOT EXISTS correlation_id UUID;
CREATE INDEX IF NOT EXISTS idx_outbox_jobs_correlation_id ON outbox_jobs(correlation_id);