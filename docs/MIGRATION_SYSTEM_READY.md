# ✅ Automated Migration System Ready

## What Was Created

An automated migration system that can run SQL scripts against your Supabase database from the command line.

## Files Created

1. **`scripts/run-migration.js`** - Migration runner script
2. **`docs/supabase-exec-sql-function.sql`** - Helper function for Supabase (run once)
3. **`docs/MIGRATION_SYSTEM.md`** - Documentation

## How It Works

### Two-Step Setup (One-Time)

**Step 1: Install the exec_sql function in Supabase**

```bash
node scripts/run-migration.js docs/supabase-exec-sql-function.sql
```

This will show you the SQL to copy-paste into Supabase SQL Editor (one-time setup).

**Step 2: Run any migration**

```bash
node scripts/run-migration.js docs/migration-email-sequences.sql
```

### What Happens

1. Script reads the SQL file
2. Parses it into individual statements
3. Executes each statement via Supabase RPC
4. Shows progress for each statement
5. Reports success/failure

### Fallback Mode

If the `exec_sql` function isn't installed, the script automatically:
- Detects the missing function
- Shows manual instructions
- Displays the full SQL content for copy-paste

## Usage Examples

### Run Email Sequences Migration

```bash
node scripts/run-migration.js docs/migration-email-sequences.sql
```

**Expected Output:**
```
📄 Reading migration: docs/migration-email-sequences.sql
📊 Found 12 SQL statements to execute

🔄 Executing migration...
─────────────────────────────────────────────────────

[1/12] CREATE TABLE IF NOT EXISTS email_sequences ( id SERIAL PRIMARY KEY, name...
[2/12] CREATE TABLE IF NOT EXISTS email_sequence_enrollments ( id SERIAL PRIMAR...
[3/12] CREATE INDEX IF NOT EXISTS idx_enrollments_lead ON email_sequence_enroll...
...
[12/12] CREATE POLICY "Allow all operations on enrollments" ON email_sequence_e...

─────────────────────────────────────────────────────
✅ Migration completed successfully!
   12 statements executed
```

### Run Any Future Migration

```bash
node scripts/run-migration.js docs/migration-lead-scoring.sql
node scripts/run-migration.js docs/migration-new-feature.sql
```

## Benefits

✅ **No manual copy-paste** - Run migrations with one command  
✅ **Progress tracking** - See each statement execute  
✅ **Error handling** - Clear error messages if something fails  
✅ **Automatic fallback** - Shows manual instructions if needed  
✅ **Safe** - Uses Supabase service role key (read from .env.local)  

## Environment Variables Required

Make sure `.env.local` has:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

Get the service role key from: https://supabase.com/dashboard/project/_/settings/api

## Next Steps

1. **Install exec_sql function** (one-time):
   ```bash
   node scripts/run-migration.js docs/supabase-exec-sql-function.sql
   ```
   Copy the SQL output and run it in Supabase SQL Editor.

2. **Run email sequences migration**:
   ```bash
   node scripts/run-migration.js docs/migration-email-sequences.sql
   ```

3. **Verify tables created**:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name LIKE 'email_%';
   ```

## Troubleshooting

### "Missing Supabase credentials"
Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`

### "exec_sql function not found"
Run the setup SQL first:
```bash
node scripts/run-migration.js docs/supabase-exec-sql-function.sql
```

### "Permission denied"
Make sure you're using the **service role key**, not the anon key.

---

**Ready to use!** Run the email sequences migration whenever you're ready to test Deliverable 1.
