# Database Migration Guide

This guide explains how to run database migrations for the WhatsApp Inbox Dashboard.

## 📋 Migration Files

All migration files are located in the `/migrations` directory, numbered sequentially:

1. `001_add_correlation_ids.sql` - Adds request tracking
2. `002_add_idempotency.sql` - Adds idempotency protection
3. `003_add_search_indexes.sql` - Adds full-text search indexes
4. `004_add_thread_status.sql` - Adds thread status, unread count, assignment
5. `005_add_notes_and_tags.sql` - Adds thread notes and tags tables
6. `006_add_reply_templates.sql` - Adds reply templates table
7. `007_add_media_fields.sql` - Adds media fields to messages
8. `008_add_automation_rules.sql` - Adds automation rules table
9. `009_add_sla_fields.sql` - Adds SLA tracking fields
10. `010_add_automated_flag.sql` - Adds automated message flag
11. `011_add_analytics_views.sql` - Creates analytics views
12. `012_add_channels.sql` - Adds multi-channel support
13. `013_add_user_roles.sql` - Adds user roles and permissions

## 🚀 How to Run Migrations

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open each migration file in order (001 → 013)
4. Copy and paste the SQL into the editor
5. Click **Run** to execute

**Important:** Run migrations in numerical order (001, 002, 003, etc.)

### Option 2: Supabase CLI

If you have Supabase CLI installed:

```bash
# Link to your project
supabase link --project-ref your-project-ref

# Run all migrations
supabase db push
```

### Option 3: psql Command Line

```bash
# Connect to your Supabase database
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Run migrations one by one
\i migrations/001_add_correlation_ids.sql
\i migrations/002_add_idempotency.sql
# ... etc
```

## ✅ Verifying Migrations

### Check if Tables Exist

Run this query in Supabase SQL Editor to see which tables exist:

```sql
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

### Expected Tables (after all migrations)

- `automation_rules`
- `channels`
- `contacts`
- `messages`
- `outbox_jobs`
- `reply_templates`
- `tags`
- `thread_notes`
- `thread_tags`
- `threads`
- `user_roles`

### Check if Columns Exist

To verify specific columns were added:

```sql
-- Check if user_roles table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'user_roles'
);

-- Check if channels table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'channels'
);

-- Check if thread_notes table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'thread_notes'
);
```

### Check if Indexes Exist

```sql
-- List all indexes
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

## 🔍 Migration Status Checker

Use the script below to check which migrations have been applied:

```sql
-- Migration Status Checker
-- Run this in Supabase SQL Editor

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
```

## ⚠️ Important Notes

1. **Idempotent Migrations:** All migrations use `IF NOT EXISTS` clauses, so they're safe to run multiple times
2. **Order Matters:** Run migrations in numerical order (001 → 013)
3. **Backup First:** Always backup your database before running migrations in production
4. **Test First:** Test migrations on a staging/dev database first

## 🐛 Troubleshooting

### Migration Fails with "column already exists"
- This is normal - migrations use `IF NOT EXISTS` so they're safe to re-run
- The migration likely already applied

### Migration Fails with "table does not exist"
- You may be missing the base schema (contacts, threads, messages, outbox_jobs)
- Check if these core tables exist first

### Foreign Key Constraint Errors
- Make sure you're running migrations in order
- Some migrations depend on previous ones

## 📝 Base Schema Requirements

The migrations assume these base tables already exist:
- `contacts` (with `id`, `phone_e164`)
- `threads` (with `id`, `contact_id`, `last_message_at`, `last_message_preview`)
- `messages` (with `id`, `thread_id`, `direction`, `body`, `status`, `created_at`)
- `outbox_jobs` (with `id`, `message_id`, `to_phone_e164`, `body`, `status`)

If these don't exist, you'll need to create them first or check your Supabase setup.

