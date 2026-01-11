-- Migration: Create analytics views
-- Phase 5.1: Metrics Tables/Views

-- First response time per thread
CREATE OR REPLACE VIEW thread_metrics AS
SELECT 
  t.id,
  t.contact_id,
  MIN(CASE WHEN m.direction = 'in' THEN m.created_at END) as first_inbound_at,
  MIN(CASE WHEN m.direction = 'out' THEN m.created_at END) as first_outbound_at,
  EXTRACT(EPOCH FROM (MIN(CASE WHEN m.direction = 'out' THEN m.created_at END) - 
                      MIN(CASE WHEN m.direction = 'in' THEN m.created_at END))) as first_response_seconds,
  COUNT(*) FILTER (WHERE m.direction = 'in') as inbound_count,
  COUNT(*) FILTER (WHERE m.direction = 'out') as outbound_count
FROM threads t
LEFT JOIN messages m ON m.thread_id = t.id
GROUP BY t.id, t.contact_id;

-- Daily message counts
CREATE OR REPLACE VIEW daily_message_stats AS
SELECT 
  DATE(created_at) as date,
  direction,
  COUNT(*) as message_count
FROM messages
GROUP BY DATE(created_at), direction;

