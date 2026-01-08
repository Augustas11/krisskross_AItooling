-- ============================================
-- KrissKross CRM - Leads Table Schema
-- Created: 2026-01-08
-- ============================================

-- Create the leads table
CREATE TABLE IF NOT EXISTS leads (
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
    
    -- Scoring & Profiling
    score INTEGER DEFAULT 0,
    tier TEXT DEFAULT 'GRAY',
    score_breakdown JSONB DEFAULT '{}',
    last_scored_at TIMESTAMP WITH TIME ZONE,
    
    -- Tag System
    tags JSONB DEFAULT '[]',
    instagram_followers INTEGER,
    engagement_rate DECIMAL(5,2),
    posting_frequency TEXT,
    last_tagged_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    enriched BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_tags ON leads USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_leads_tier ON leads(tier);
CREATE INDEX IF NOT EXISTS idx_leads_instagram_followers ON leads(instagram_followers);
CREATE INDEX IF NOT EXISTS idx_leads_engagement_rate ON leads(engagement_rate);

-- Enable Row Level Security (RLS)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow all operations" ON leads;

-- Create policy to allow all operations
CREATE POLICY "Allow all operations" ON leads
    FOR ALL
    USING (true)
    WITH CHECK (true);
