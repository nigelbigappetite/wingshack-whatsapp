-- Migration: Add SLA fields to threads
-- Phase 4.2: SLA Timers + Reminders

ALTER TABLE threads ADD COLUMN IF NOT EXISTS first_response_due_at TIMESTAMPTZ;
ALTER TABLE threads ADD COLUMN IF NOT EXISTS follow_up_due_at TIMESTAMPTZ;
ALTER TABLE threads ADD COLUMN IF NOT EXISTS sla_breached_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_threads_sla_due ON threads(first_response_due_at) WHERE first_response_due_at IS NOT NULL;

