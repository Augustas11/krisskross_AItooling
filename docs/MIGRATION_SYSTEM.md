# Automated Migration System

## Overview

The migration system allows you to run SQL migrations against Supabase automatically from the command line, without needing to manually copy-paste into the SQL Editor.

## Setup

### Option 1: Using Service Role Key (Recommended)

1. Go to your Supabase project settings: https://supabase.com/dashboard/project/_/settings/api
2. Copy the **service_role** key (under "Project API keys")
3. Add to `.env.local`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

### Option 2: Using Anon Key (Limited)

If you don't have access to the service role key, the system will fall back to using the anon key and provide manual instructions.

## Usage

### Run a Migration

```bash
node scripts/run-migration.js docs/migration-email-sequences.sql
```

### What Happens

1. Script reads the SQL file
2. Attempts to execute via Supabase Management API
3. If successful: ✅ Migration applied automatically
4. If failed: 📋 Shows manual instructions + SQL content for copy-paste

## Example

```bash
$ node scripts/run-migration.js docs/migration-email-sequences.sql

📄 Reading migration: docs/migration-email-sequences.sql
🔄 Executing SQL migration via Supabase API...
─────────────────────────────────────────────────────

✅ Migration completed successfully!
```

## Troubleshooting

### "Missing Supabase credentials"

Make sure `.env.local` has:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### "Automated migration failed"

The script will automatically fall back to showing manual instructions:

1. Copy the SQL content from the terminal output
2. Go to Supabase SQL Editor
3. Paste and run

## Files

- `scripts/run-migration.js` - Migration runner script
- `docs/migration-*.sql` - SQL migration files
- `docs/supabase-exec-sql-function.sql` - Helper function (optional, not required)
