-- Migration: Add automation rules
-- Phase 4.1: Rules Engine v1

CREATE TABLE IF NOT EXISTS automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  match_type TEXT NOT NULL, -- 'contains', 'equals', 'regex', 'phone'
  match_value TEXT NOT NULL,
  actions_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_automation_rules_enabled ON automation_rules(enabled, priority);

