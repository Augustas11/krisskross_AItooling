-- ============================================
-- KrissKross CRM - Tag System Migration
-- ============================================
-- This migration adds comprehensive tagging support to the leads table
-- Using JSONB for fast filtering and simple CSV imports

-- Step 1: Add new columns to leads table
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS instagram_followers INTEGER,
ADD COLUMN IF NOT EXISTS engagement_rate DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS posting_frequency TEXT,
ADD COLUMN IF NOT EXISTS last_tagged_at TIMESTAMP WITH TIME ZONE;

-- Step 2: Create GIN index for fast JSONB tag queries
-- This enables fast filtering like: WHERE tags @> '[{"full_tag": "business:fashion"}]'
CREATE INDEX IF NOT EXISTS idx_leads_tags ON leads USING GIN (tags);

-- Step 3: Create indexes for tag-related filtering
CREATE INDEX IF NOT EXISTS idx_leads_tier ON leads(tier);
CREATE INDEX IF NOT EXISTS idx_leads_instagram_followers ON leads(instagram_followers);
CREATE INDEX IF NOT EXISTS idx_leads_engagement_rate ON leads(engagement_rate);
CREATE INDEX IF NOT EXISTS idx_leads_posting_frequency ON leads(posting_frequency);
CREATE INDEX IF NOT EXISTS idx_leads_last_tagged_at ON leads(last_tagged_at);

-- Step 4: Add comment documentation
COMMENT ON COLUMN leads.tags IS 'JSONB array of tag objects with category, name, full_tag, applied_by, applied_at, and optional confidence';
COMMENT ON COLUMN leads.instagram_followers IS 'Follower count from Apify API, refreshed daily';
COMMENT ON COLUMN leads.engagement_rate IS 'Calculated engagement rate (likes+comments)/followers, refreshed weekly';
COMMENT ON COLUMN leads.posting_frequency IS 'Posting frequency category: low, ideal, high, power_user';
COMMENT ON COLUMN leads.last_tagged_at IS 'Timestamp of last auto-tagging run';

-- Step 5: Create helper function to check if lead has specific tag
CREATE OR REPLACE FUNCTION lead_has_tag(lead_tags JSONB, tag_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN lead_tags @> jsonb_build_array(jsonb_build_object('full_tag', tag_name));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 6: Create helper function to get tags by category
CREATE OR REPLACE FUNCTION get_tags_by_category(lead_tags JSONB, category_name TEXT)
RETURNS JSONB AS $$
BEGIN
  RETURN (
    SELECT jsonb_agg(tag)
    FROM jsonb_array_elements(lead_tags) AS tag
    WHERE tag->>'category' = category_name
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- Example Queries for SDR Workflow
-- ============================================

-- Find all GREEN priority leads not yet contacted
-- SELECT * FROM leads 
-- WHERE lead_has_tag(tags, 'priority:🟢GREEN') 
-- AND NOT lead_has_tag(tags, 'outreach:email_1_sent')
-- ORDER BY score DESC
-- LIMIT 20;

-- Find fashion sellers in US with manual_video pain point
-- SELECT * FROM leads
-- WHERE lead_has_tag(tags, 'business:fashion')
-- AND lead_has_tag(tags, 'geo:US')
-- AND lead_has_tag(tags, 'pain:manual_video')
-- ORDER BY score DESC;

-- Find leads with 10k-100k followers (ideal range)
-- SELECT * FROM leads
-- WHERE lead_has_tag(tags, 'followers:10k-100k')
-- AND tier = 'GREEN'
-- ORDER BY engagement_rate DESC;

-- ============================================
-- Migration Complete!
-- ============================================
-- Next steps:
-- 1. Run this migration in Supabase SQL Editor
-- 2. Verify indexes created: SELECT * FROM pg_indexes WHERE tablename = 'leads';
-- 3. Test helper functions with sample data
-- 4. Run tag seed script to tag existing leads
