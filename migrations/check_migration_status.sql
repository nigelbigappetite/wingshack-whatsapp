-- Migration Status Checker
-- Run this in Supabase SQL Editor to see which migrations have been applied

SELECT 
  '001_correlation_ids' as migration,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'request_id')
      AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'outbox_jobs' AND column_name = 'correlation_id')
    THEN '✅ Applied'
    ELSE '❌ Not Applied'
  END as status
UNION ALL
SELECT 
  '002_idempotency',
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'idempotency_key')
      AND EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_messages_provider_unique')
    THEN '✅ Applied'
    ELSE '❌ Not Applied'
  END
UNION ALL
SELECT 
  '003_search_indexes',
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE indexname LIKE '%search%' OR indexname LIKE '%tsvector%')
    THEN '✅ Applied'
    ELSE '❌ Not Applied'
  END
UNION ALL
SELECT 
  '004_thread_status',
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'threads' AND column_name = 'status')
      AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'threads' AND column_name = 'unread_count')
    THEN '✅ Applied'
    ELSE '❌ Not Applied'
  END
UNION ALL
SELECT 
  '005_notes_and_tags',
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'thread_notes')
      AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tags')
    THEN '✅ Applied'
    ELSE '❌ Not Applied'
  END
UNION ALL
SELECT 
  '006_reply_templates',
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reply_templates')
    THEN '✅ Applied'
    ELSE '❌ Not Applied'
  END
UNION ALL
SELECT 
  '007_media_fields',
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'media_url')
    THEN '✅ Applied'
    ELSE '❌ Not Applied'
  END
UNION ALL
SELECT 
  '008_automation_rules',
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'automation_rules')
    THEN '✅ Applied'
    ELSE '❌ Not Applied'
  END
UNION ALL
SELECT 
  '009_sla_fields',
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'threads' AND column_name = 'first_response_due_at')
    THEN '✅ Applied'
    ELSE '❌ Not Applied'
  END
UNION ALL
SELECT 
  '010_automated_flag',
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'is_automated')
    THEN '✅ Applied'
    ELSE '❌ Not Applied'
  END
UNION ALL
SELECT 
  '011_analytics_views',
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'daily_message_stats')
    THEN '✅ Applied'
    ELSE '❌ Not Applied'
  END
UNION ALL
SELECT 
  '012_channels',
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'channels')
      AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'threads' AND column_name = 'channel_id')
    THEN '✅ Applied'
    ELSE '❌ Not Applied'
  END
UNION ALL
SELECT 
  '013_user_roles',
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles')
    THEN '✅ Applied'
    ELSE '❌ Not Applied'
  END
ORDER BY migration;

