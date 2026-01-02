-- Enrichment Status Tracking
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS enrichment_status TEXT 
  CHECK (enrichment_status IN ('not_enriched', 'partial', 'complete', 'failed', 'needs_update'))
  DEFAULT 'not_enriched';

ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS enrichment_last_attempt TIMESTAMPTZ;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS enrichment_version INTEGER DEFAULT 1;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS data_confidence_score INTEGER DEFAULT 0 
  CHECK (data_confidence_score BETWEEN 0 AND 100);
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS needs_manual_review BOOLEAN DEFAULT false;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS sdr_notes TEXT;

-- Validation Fields
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS enrichment_data_sources JSONB DEFAULT '{}';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_leads_enrichment_status ON public.leads(enrichment_status);
CREATE INDEX IF NOT EXISTS idx_leads_confidence ON public.leads(data_confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_manual_review ON public.leads(needs_manual_review) WHERE needs_manual_review = true;
