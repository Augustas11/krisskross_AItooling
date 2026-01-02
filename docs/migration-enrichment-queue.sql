CREATE TABLE IF NOT EXISTS enrichment_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id TEXT REFERENCES public.leads(id) ON DELETE CASCADE,
  priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  reason TEXT NOT NULL,
  attempts INTEGER DEFAULT 0,
  last_attempt TIMESTAMPTZ,
  status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  error_log JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fetching pending items efficiently
CREATE INDEX IF NOT EXISTS idx_enrichment_queue_pending 
  ON enrichment_queue(status, priority, created_at)
  WHERE status = 'pending';

-- Index for checking if a lead is already in queue
CREATE INDEX IF NOT EXISTS idx_enrichment_queue_lead 
  ON enrichment_queue(lead_id);
