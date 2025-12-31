# 🚀 Supabase Setup Guide for KrissKross CRM

This guide will walk you through setting up Supabase for your CRM data persistence.

## Why Supabase?

✅ **Cloud-based**: Your data is safe even if your computer crashes  
✅ **Real-time**: Automatic syncing across devices  
✅ **Scalable**: Handles thousands of leads effortlessly  
✅ **Free tier**: Generous free tier for personal use  
✅ **Backup**: Automatic backups and point-in-time recovery  

---

## Step 1: Create a Supabase Account

1. Go to [supabase.com](https://supabase.com)
2. Click **"Start your project"**
3. Sign up with GitHub (recommended) or email
4. Verify your email if needed

---

## Step 2: Create a New Project

1. Click **"New Project"**
2. Fill in the details:
   - **Name**: `krisskross-crm` (or any name you prefer)
   - **Database Password**: Choose a strong password (save it somewhere safe!)
   - **Region**: Choose the closest region to you
   - **Pricing Plan**: Select **Free** (perfect for getting started)
3. Click **"Create new project"**
4. Wait 2-3 minutes for the project to be provisioned ☕

---

## Step 3: Create the Database Table

1. In your Supabase dashboard, click **"SQL Editor"** in the left sidebar
2. Click **"New query"**
3. Copy and paste this SQL:

\`\`\`sql
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
    website TEXT,
    
    -- Metadata
    enriched BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Allow all operations (for local tool usage)
CREATE POLICY "Allow all operations" ON leads
    FOR ALL
    USING (true)
    WITH CHECK (true);
\`\`\`

4. Click **"Run"** (or press Cmd/Ctrl + Enter)
5. You should see: ✅ **"Success. No rows returned"**

---

## Step 4: Get Your API Credentials

1. Click **"Settings"** (gear icon) in the left sidebar
2. Click **"API"** under Project Settings
3. You'll see two important values:

   📋 **Project URL**  
   Example: `https://abcdefghijklmnop.supabase.co`
   
   📋 **anon public key**  
   Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (very long string)

4. **Copy both values** - you'll need them in the next step!

---

## Step 5: Add Credentials to Your Project

1. Open your project in VS Code (or your editor)
2. Open the file `.env.local` (create it if it doesn't exist)
3. Add these two lines (replace with YOUR actual values):

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
\`\`\`

4. **Save the file**
5. **Restart your dev server**:
   - Stop the current server (Ctrl+C in terminal)
   - Run `npm run dev` again

---

## Step 6: Migrate Existing Data (Optional)

If you already have leads in `leads_db.json`, migrate them to Supabase:

\`\`\`bash
# Install dotenv for the migration script
npm install dotenv

# Run the migration
node scripts/migrate-to-supabase.js
\`\`\`

You should see:
\`\`\`
✅ Successfully migrated X leads to Supabase!
\`\`\`

---

## Step 7: Test It Out!

1. Open your app: `http://localhost:3000`
2. Open the browser console (F12 or Cmd+Option+I)
3. Look for these messages:
   - `🔄 [SUPABASE] Fetching leads from database...`
   - `✅ [SUPABASE] Fetched X leads`
4. Try adding a new lead:
   - Go to **Lead Discovery** tab
   - Scrape a URL or add manually
   - Click **"Save to CRM"**
5. Check the console for:
   - `💾 [CRM] Syncing X leads to server...`
   - `✅ [SUPABASE] Successfully synced X leads`
6. **Refresh the page** - your data should still be there! 🎉

---

## Troubleshooting

### ❌ "Supabase not configured"
- Make sure you added the credentials to `.env.local`
- Restart your dev server (`npm run dev`)
- Check for typos in the environment variable names

### ❌ "Error fetching leads"
- Verify your Supabase project is active (check the dashboard)
- Make sure you ran the SQL schema in Step 3
- Check that RLS policies are set up correctly

### ❌ "Error inserting leads"
- Check the browser console for detailed error messages
- Verify the table structure matches the schema
- Make sure the `id` field is unique

### 🆘 Still having issues?
Check the terminal and browser console for detailed error messages with emoji prefixes:
- 🔄 = Loading/Processing
- ✅ = Success
- ❌ = Error
- ⚠️ = Warning

---

## What's Next?

Your CRM data is now safely stored in Supabase! 🎉

**Benefits you now have:**
- ✅ Data persists across browser refreshes
- ✅ Data survives computer restarts
- ✅ Data is backed up in the cloud
- ✅ Can access from multiple devices (future feature)
- ✅ Automatic backups by Supabase

**Optional enhancements:**
- Set up authentication for multi-user access
- Enable real-time subscriptions for live updates
- Add more advanced RLS policies for security
- Set up automated backups

---

## Quick Reference

**Supabase Dashboard**: [app.supabase.com](https://app.supabase.com)  
**Documentation**: [supabase.com/docs](https://supabase.com/docs)  
**Schema File**: `docs/supabase-schema.md`  
**Migration Script**: `scripts/migrate-to-supabase.js`

---

**Need help?** Check the Supabase docs or the error messages in your console! 🚀
