
-- Upgrade Script for Lead Enrichment V2
-- Adds support for Perplexity Research + Extended Apify Data

-- 1. Add column for Perplexity Research Summary
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS ai_research_summary TEXT;

-- 2. Add columns for Extended Apify Data
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS instagram_business_category TEXT,
ADD COLUMN IF NOT EXISTS has_reels BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS avg_video_views INTEGER;

-- 3. Add Activity/History Log (JSONB)
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS enrichment_history JSONB DEFAULT '[]';

-- 4. Comment on new columns
COMMENT ON COLUMN leads.ai_research_summary IS 'Deep research summary text from Perplexity AI';
COMMENT ON COLUMN leads.avg_video_views IS 'Average video views from recent Reels (via Apify)';
COMMENT ON COLUMN leads.enrichment_history IS 'Log of all enrichment activities and API calls';
