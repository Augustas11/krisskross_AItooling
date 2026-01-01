
-- Create Backups Table for CRM Safety Net
CREATE TABLE IF NOT EXISTS leads_backups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  snapshot_data JSONB,
  lead_count INTEGER,
  source TEXT
);

-- Index for cleaning up old backups
CREATE INDEX IF NOT EXISTS idx_leads_backups_created_at ON leads_backups(created_at DESC);
