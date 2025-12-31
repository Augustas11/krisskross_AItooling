# Supabase Database Schema for KrissKross CRM

## Table: leads

This table stores all CRM leads for the KrissKross Pitch Generator.

### SQL Schema

```sql
-- Create the leads table
CREATE TABLE leads (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    product_category TEXT,
    store_url TEXT,
    rating TEXT,
    brief_description TEXT,
    status TEXT DEFAULT 'New',
    added_at TEXT,
    last_interaction TEXT,
    
    -- Enriched contact information
    business_address TEXT,
    email TEXT,
    phone TEXT,
    instagram TEXT,
    tiktok TEXT,
    website TEXT,
    
    -- Metadata
    enriched BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on status for faster filtering
CREATE INDEX idx_leads_status ON leads(status);

-- Create index on created_at for sorting
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust based on your auth needs)
-- For now, we'll allow anonymous access since this is a local tool
CREATE POLICY "Allow all operations" ON leads
    FOR ALL
    USING (true)
    WITH CHECK (true);
```

### Column Descriptions

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT | Unique identifier (e.g., "lead_1767151009332") |
| `name` | TEXT | Lead/business name |
| `product_category` | TEXT | Product category or niche |
| `store_url` | TEXT | URL to the store/website |
| `rating` | TEXT | Store rating if available |
| `brief_description` | TEXT | Brief description of the business |
| `status` | TEXT | Lead status: New, Enriched, Pitched, Replied, Dead |
| `added_at` | TEXT | Date when lead was added (formatted string) |
| `last_interaction` | TEXT | Last interaction date (formatted string) |
| `business_address` | TEXT | Physical business address (enriched data) |
| `email` | TEXT | Contact email (enriched data) |
| `phone` | TEXT | Contact phone (enriched data) |
| `instagram` | TEXT | Instagram handle (enriched data) |
| `tiktok` | TEXT | TikTok profile URL (enriched data) |
| `website` | TEXT | Website URL (enriched data) |
| `enriched` | BOOLEAN | Whether lead has been enriched with contact info |
| `created_at` | TIMESTAMP | Auto-generated creation timestamp |
| `updated_at` | TIMESTAMP | Auto-generated update timestamp |

## Setup Instructions

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Navigate to the SQL Editor in your Supabase dashboard
3. Copy and paste the SQL schema above
4. Click "Run" to create the table
5. Copy your project URL and anon key from Settings > API
6. Add them to your `.env.local` file:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

## Migration from leads_db.json

If you have existing data in `leads_db.json`, you can migrate it using the migration script:

```bash
node scripts/migrate-to-supabase.js
```
