-- Cleanup script for migration 002: Remove duplicate messages before creating unique index
-- Run this BEFORE running 002_add_idempotency.sql if you get a duplicate key error

-- Step 1: Check which column name exists (wa_message_id or provider_message_id)
DO $$
DECLARE
  column_name TEXT;
BEGIN
  SELECT column_name INTO column_name
  FROM information_schema.columns
  WHERE table_name = 'messages' 
    AND (column_name = 'wa_message_id' OR column_name = 'provider_message_id')
  LIMIT 1;
  
  IF column_name IS NULL THEN
    RAISE NOTICE 'Neither wa_message_id nor provider_message_id column found';
  ELSE
    RAISE NOTICE 'Using column: %', column_name;
  END IF;
END $$;

-- Step 2: Identify duplicate messages
-- This query shows all duplicate provider_message_id + direction combinations
-- Works with either wa_message_id or provider_message_id column
SELECT 
  COALESCE(provider_message_id, wa_message_id) as message_id,
  direction,
  COUNT(*) as duplicate_count,
  array_agg(id ORDER BY created_at) as message_ids,
  array_agg(created_at ORDER BY created_at) as created_dates
FROM messages
WHERE COALESCE(provider_message_id, wa_message_id) IS NOT NULL
GROUP BY COALESCE(provider_message_id, wa_message_id), direction
HAVING COUNT(*) > 1;

-- Step 3: Delete duplicate messages (keeping only the oldest)
-- This deletes duplicates, keeping the one with the earliest created_at timestamp
DELETE FROM messages m1
WHERE COALESCE(m1.provider_message_id, m1.wa_message_id) IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM messages m2
    WHERE COALESCE(m2.provider_message_id, m2.wa_message_id) = COALESCE(m1.provider_message_id, m1.wa_message_id)
      AND m2.direction = m1.direction
      AND m2.created_at < m1.created_at  -- Keep the older one
  );

-- Step 4: Verify no duplicates remain
SELECT 
  COALESCE(provider_message_id, wa_message_id) as message_id,
  direction,
  COUNT(*) as count
FROM messages
WHERE COALESCE(provider_message_id, wa_message_id) IS NOT NULL
GROUP BY COALESCE(provider_message_id, wa_message_id), direction
HAVING COUNT(*) > 1;
-- This should return 0 rows if cleanup was successful

