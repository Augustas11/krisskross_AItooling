# Database Migrations Manifest

> **Purpose:** Track all database migrations, their status, and application history  
> **Last Updated:** [DATE]

---

## 📊 Migration Status Overview

| Status | Count | Description |
|--------|-------|-------------|
| ✅ Applied | 0 | Successfully run |
| 🔄 Pending | 0 | Ready to apply |
| 📝 Draft | 0 | Work in progress |

---

## 🗂️ Applied Migrations

<!-- 
List your migrations here.
Format:
| Migration File | Purpose | Applied Date | Notes |
|----------------|---------|--------------|-------|
| `001_initial_schema.sql` | Core tables | YYYY-MM-DD | Initial setup |
-->

| Migration File | Purpose | Applied Date | Notes |
|----------------|---------|--------------|-------|
| *No migrations yet* | - | - | - |

---

## 🔧 How to Apply New Migrations

### Using Supabase CLI (if applicable)
```bash
supabase migration new <name>
supabase db push
```

### Using Custom Script
```bash
node scripts/apply-migration.js docs/migrations/[file].sql
```

### Direct Application
```bash
psql $DATABASE_URL -f migrations/[file].sql
```

---

## ⚠️ Safety Rules

1. **Never re-run** an already applied migration
2. **Always backup first**
3. **Test locally** before production
4. **Update this manifest** after applying any migration
5. **Use IF NOT EXISTS** for idempotent migrations

---

## 🗃️ Schema Quick Reference

<!-- List your main tables here -->
### Core Tables
- `[table_1]` - Description
- `[table_2]` - Description

---

## 📝 Migration Template

```sql
-- Migration: [name]
-- Purpose: [what this does]
-- Date: [YYYY-MM-DD]

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'your_table') THEN
        CREATE TABLE your_table (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        RAISE NOTICE 'Migration applied: your_table created';
    ELSE
        RAISE NOTICE 'Migration skipped: your_table already exists';
    END IF;
END $$;
```

---

*Last audit: [DATE]*
