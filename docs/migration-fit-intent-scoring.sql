-- Migration: Separate Fit vs Intent Scoring + Lead Decay
-- Adds new scoring columns and last_activity tracking

-- 1. Add new scoring columns
ALTER TABLE leads ADD COLUMN IF NOT EXISTS fit_score INTEGER DEFAULT 50;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS intent_score INTEGER DEFAULT 50;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS priority_score INTEGER DEFAULT 2500; -- fit_score * intent_score
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_priority ON leads(priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_last_activity ON leads(last_activity_at DESC);

-- 3. Migrate existing scores to fit_score (one-time data migration)
UPDATE leads 
SET fit_score = score,
    intent_score = 50,
    priority_score = score * 50,
    last_activity_at = COALESCE(updated_at, created_at, NOW())
WHERE fit_score IS NULL OR fit_score = 50;

-- 4. Add comment explaining the scoring system
COMMENT ON COLUMN leads.fit_score IS 'Static score based on follower count, geography, business category (0-100)';
COMMENT ON COLUMN leads.intent_score IS 'Dynamic score based on pain points, trial usage, email engagement (0-100)';
COMMENT ON COLUMN leads.priority_score IS 'fit_score × intent_score (0-10,000), used for lead prioritization';
COMMENT ON COLUMN leads.last_activity_at IS 'Last meaningful activity (trial usage, email open, reply). Used for lead decay.';
