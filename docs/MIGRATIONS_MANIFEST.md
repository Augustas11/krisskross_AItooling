# Database Migrations Manifest

> **Purpose:** Track all database migrations, their status, and application history  
> **Last Updated:** 2026-01-12

---

## 📊 Migration Status Overview

| Status | Count | Description |
|--------|-------|-------------|
| ✅ Applied | 22 | Successfully run on production |
| 🔄 Pending | 0 | Ready to apply |
| 📝 Draft | 0 | Work in progress |

---

## 🗂️ Supabase Official Migrations

Located in `/supabase/migrations/` - these are tracked by Supabase CLI.

| Migration File | Purpose | Applied Date | Notes |
|----------------|---------|--------------|-------|
| `20260106121500_sendgrid_schema.sql` | Email tables (sendgrid integration) | Jan 6, 2026 | Core email tables |
| `20260107000000_create_leads_table.sql` | Main leads table | Jan 7, 2026 | Core CRM table |
| `20260108000000_instagram_complete.sql` | Full Instagram schema | Jan 8, 2026 | IG sync, matches, tokens |
| `20260108110000_add_unique_constraint.sql` | Unique constraints | Jan 8, 2026 | Prevent duplicates |
| `trigger_setup.sql` | Database triggers | Jan 8, 2026 | Automation hooks |

---

## 📁 Manual Migration Files (/docs)

These were applied via scripts. **Do not re-run**.

### Phase 1: Core Schema (Applied Jan 3, 2026)

| File | Purpose | Applied By |
|------|---------|-----------|
| `migration-phase1-tasks.sql` | Task management tables | `apply-phase1-migration.js` |
| `migration-search-history.sql` | Search tracking | Manual |
| `migration-pitch-email-history.sql` | Pitch & email logs | Manual |
| `migration-leads-backups.sql` | Backup metadata table | Manual |

### Phase 2: Feature Expansion (Applied Jan 3, 2026)

| File | Purpose | Applied By |
|------|---------|-----------|
| `migration-phase2-affiliate-refactor.sql` | Affiliate tracking | `apply-phase2-affiliate.js` |
| `migration-phase2-pricing-nudge.sql` | Pricing experiment fields | `apply-phase2-pricing-nudge.js` |
| `migration-phase2-segments.sql` | Lead segmentation | `apply-phase2-segments.js` |
| `migration-phase2-trial-sequence.sql` | Trial email sequences | Manual |
| `migration-email-sequences.sql` | Automated email config | Manual |

### Phase 3: Activity & Automation (Applied Jan 3, 2026)

| File | Purpose | Applied By |
|------|---------|-----------|
| `migration-phase3-activity-logs.sql` | Activity feed tables | `apply-phase3-activity-logs.js` |
| `migration-phase3-playbooks.sql` | SDR playbooks | `apply-phase3-playbooks.js` |
| `migration-phase3-settings.sql` | User settings | `apply-phase3-settings.js` |
| `migration-activity-feed.sql` | Activity display | Manual |

### Enrichment (Applied Jan 2, 2026)

| File | Purpose | Applied By |
|------|---------|-----------|
| `migration-enrichment-queue.sql` | Enrichment job queue | Manual |
| `migration-enrichment-status.sql` | Enrichment tracking | Manual |
| `migration-fit-intent-scoring.sql` | Lead scoring fields | Manual |
| `migration-lead-scoring.sql` | Scoring algorithm data | Manual |

### Instagram (Applied Jan 4-8, 2026)

| File | Purpose | Applied By |
|------|---------|-----------|
| `20250104_instagram_integration.sql` | Initial IG schema | `run-instagram-migration.js` |
| `instagram-realtime-triggers.sql` | Real-time sync triggers | Manual |
| `INSTAGRAM_COMPLETE_MIGRATION.sql` | Consolidated IG schema | Manual (root file) |

### Other

| File | Purpose | Applied By |
|------|---------|-----------|
| `supabase-tag-migration.sql` | Tag system | `seed-tags.js` |
| `supabase-enrichment-v2.sql` | Enrichment v2 fields | Manual |
| `supabase-exec-sql-function.sql` | SQL execution helper | Manual |

---

## 🔧 How to Apply New Migrations

### Using Supabase CLI (Recommended)

```bash
# Create new migration
supabase migration new <name>

# Apply all pending migrations
supabase db push

# Check migration status
supabase migration list
```

### Manual Application

```bash
# Using the robust script
node scripts/apply-migrations-robust.js docs/migration-<name>.sql

# Direct via psql (if you have direct access)
psql $DATABASE_URL -f docs/migration-<name>.sql
```

---

## ⚠️ Safety Rules

1. **Never re-run** an already applied migration
2. **Always backup first**: `npm run backup`
3. **Test locally** before production
4. **Update this manifest** after applying any migration
5. **Use IF NOT EXISTS** for table creation to be idempotent

---

## 🗃️ Schema Quick Reference

### Core Tables
- `leads` - Main lead storage
- `lead_tags` / `tags` - Tagging system
- `search_history` - Discovery tracking
- `pitch_history` - Generated pitches
- `email_history` - Sent emails

### Automation
- `email_sequences` - Sequence definitions
- `email_sequence_steps` - Individual steps
- `automation_triggers` - Behavior triggers
- `enrichment_queue` - Enrichment jobs

### Activity
- `activity_feed` - User activity log
- `activity_logs` - System activity

### Instagram
- `instagram_tokens` - OAuth tokens
- `instagram_sync_logs` - Sync history
- `instagram_pending_matches` - Match queue

### Settings
- `user_settings` - User preferences
- `playbooks` - SDR playbooks
- `segments` - Lead segments

---

## 📝 Migration Template

When creating new migrations:

```sql
-- Migration: [name]
-- Purpose: [what this does]
-- Author: [name]
-- Date: [YYYY-MM-DD]

-- Check if migration is needed
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'your_table') THEN
        -- Create table
        CREATE TABLE your_table (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            -- your columns
        );
        
        -- Enable RLS
        ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        CREATE POLICY "your_policy" ON your_table FOR ALL USING (true);
        
        RAISE NOTICE 'Migration applied: your_table created';
    ELSE
        RAISE NOTICE 'Migration skipped: your_table already exists';
    END IF;
END $$;
```

---

## 🔍 Checking Current Schema

```sql
-- List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- List policies
SELECT tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';
```

---

*Maintained by: AI Assistant*  
*Last audit: 2026-01-12*
