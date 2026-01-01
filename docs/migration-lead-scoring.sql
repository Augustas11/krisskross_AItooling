-- Migration: Add Lead Scoring & Profiling Columns
-- Run this in your Supabase SQL Editor

-- 1. Scoring & Classification
ALTER TABLE leads ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'GRAY'; -- GREEN, YELLOW, RED, GRAY
ALTER TABLE leads ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';   -- Array of strings e.g. ['geo:US', 'followers:10k']

-- 2. Social Metrics (for Scoring inputs)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS instagram_followers INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS engagement_rate FLOAT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS posting_frequency TEXT; -- 'daily', 'weekly', 'sporadic'
ALTER TABLE leads ADD COLUMN IF NOT EXISTS avg_video_views INTEGER;

-- 3. Metadata
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_scored_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS score_breakdown JSONB DEFAULT '{}'; -- Store why they got the score

-- 4. Indexing for Performance
CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_tier ON leads(tier);
