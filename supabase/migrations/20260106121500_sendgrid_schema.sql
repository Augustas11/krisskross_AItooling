-- Migration: SendGrid Integration Schema
-- Run this in your Supabase SQL Editor
-- This extends the existing email system with comprehensive tracking

-- ============================================
-- 1. EMAIL CAMPAIGNS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Campaign details
  name TEXT NOT NULL,
  subject_line TEXT NOT NULL,
  preview_text TEXT,
  sender_name TEXT NOT NULL DEFAULT 'KrissKross',
  sender_email TEXT NOT NULL DEFAULT 'noreply@krisskross.ai',
  reply_to_email TEXT,
  
  -- SendGrid references
  sendgrid_template_id TEXT,
  sendgrid_campaign_id TEXT,
  
  -- Targeting
  target_list_id UUID,
  target_segment JSONB,
  
  -- Scheduling
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled')),
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  
  -- A/B Testing
  ab_test_enabled BOOLEAN DEFAULT FALSE,
  ab_test_config JSONB,
  
  -- Stats (cached from SendGrid webhooks)
  total_recipients INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  bounced_count INTEGER DEFAULT 0,
  unsubscribed_count INTEGER DEFAULT 0,
  
  -- Metadata
  created_by UUID,
  notes TEXT
);

-- ============================================
-- 2. EMAIL SENDS TABLE (Individual tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS email_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- References
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE SET NULL,
  lead_id TEXT, -- References leads table (TEXT id format)
  
  -- SendGrid data
  sendgrid_message_id TEXT,
  
  -- Email content snapshot
  subject_line TEXT NOT NULL,
  sent_to_email TEXT NOT NULL,
  sent_from_email TEXT NOT NULL DEFAULT 'noreply@krisskross.ai',
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'delivered', 'failed')),
  
  -- Event timestamps (updated by webhook)
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  first_clicked_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  spam_reported_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,
  
  -- Engagement metrics
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  
  -- Error handling
  bounce_reason TEXT,
  error_message TEXT,
  
  -- Sequence tracking (links to existing system)
  sequence_step INTEGER
);

-- ============================================
-- 3. EMAIL EVENTS TABLE (Detailed webhook log)
-- ============================================
CREATE TABLE IF NOT EXISTS email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- References
  email_send_id UUID REFERENCES email_sends(id) ON DELETE CASCADE,
  sendgrid_message_id TEXT,
  
  -- Event details
  event_type TEXT NOT NULL CHECK (event_type IN (
    'processed', 'dropped', 'delivered', 'deferred', 'bounce', 
    'open', 'click', 'spamreport', 'unsubscribe', 'group_unsubscribe', 'group_resubscribe'
  )),
  event_data JSONB,
  
  -- Click tracking
  url_clicked TEXT,
  user_agent TEXT,
  ip_address INET,
  
  -- Processing flag
  processed BOOLEAN DEFAULT FALSE
);

-- ============================================
-- 4. EMAIL TEMPLATES TABLE (Local + SendGrid)
-- ============================================
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  name TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('welcome', 'nurture', 'promotion', 'transactional', 'cold_outreach', 'follow_up')),
  
  -- Template content
  subject_line TEXT,
  preview_text TEXT,
  html_content TEXT,
  plain_text_content TEXT,
  
  -- SendGrid sync
  sendgrid_template_id TEXT,
  sendgrid_version_id TEXT,
  
  -- Variables/Merge fields
  required_variables JSONB DEFAULT '[]'::jsonb,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  created_by UUID
);

-- ============================================
-- 5. CONTACT LISTS TABLE (Segmentation)
-- ============================================
CREATE TABLE IF NOT EXISTS contact_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  name TEXT NOT NULL,
  description TEXT,
  
  -- SendGrid sync
  sendgrid_list_id TEXT,
  last_synced_at TIMESTAMPTZ,
  
  -- Dynamic vs static
  is_dynamic BOOLEAN DEFAULT FALSE,
  filter_criteria JSONB,
  
  -- Stats
  contact_count INTEGER DEFAULT 0,
  
  created_by UUID
);

-- ============================================
-- 6. LIST CONTACTS TABLE (Many-to-many)
-- ============================================
CREATE TABLE IF NOT EXISTS list_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  list_id UUID REFERENCES contact_lists(id) ON DELETE CASCADE,
  lead_id TEXT NOT NULL, -- References leads table
  
  -- Subscription status
  subscribed BOOLEAN DEFAULT TRUE,
  unsubscribed_at TIMESTAMPTZ,
  
  UNIQUE(list_id, lead_id)
);

-- ============================================
-- 7. EXTEND LEADS TABLE WITH EMAIL TRACKING (if exists)
-- ============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'leads') THEN
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS email_bounced BOOLEAN DEFAULT FALSE;
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS email_unsubscribed BOOLEAN DEFAULT FALSE;
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_email_sent_at TIMESTAMPTZ;
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_email_opened_at TIMESTAMPTZ;
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS email_engagement_score INTEGER DEFAULT 0;
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS sendgrid_contact_id TEXT;
    CREATE INDEX IF NOT EXISTS idx_leads_email_engagement ON leads(email_engagement_score DESC);
  END IF;
END $$;

-- ============================================
-- 8. INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_email_sends_campaign ON email_sends(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_sends_lead ON email_sends(lead_id);
CREATE INDEX IF NOT EXISTS idx_email_sends_message_id ON email_sends(sendgrid_message_id);
CREATE INDEX IF NOT EXISTS idx_email_sends_status ON email_sends(status);
CREATE INDEX IF NOT EXISTS idx_email_sends_created ON email_sends(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_events_send ON email_events(email_send_id);
CREATE INDEX IF NOT EXISTS idx_email_events_message_id ON email_events(sendgrid_message_id);
CREATE INDEX IF NOT EXISTS idx_email_events_type ON email_events(event_type);

CREATE INDEX IF NOT EXISTS idx_list_contacts_list ON list_contacts(list_id);
CREATE INDEX IF NOT EXISTS idx_list_contacts_lead ON list_contacts(lead_id);

-- ============================================
-- 9. ROW LEVEL SECURITY
-- ============================================
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_contacts ENABLE ROW LEVEL SECURITY;

-- Policies: Allow all operations (service role access for edge functions)
CREATE POLICY "Service role access on email_campaigns" ON email_campaigns FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role access on email_sends" ON email_sends FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role access on email_events" ON email_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role access on email_templates" ON email_templates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role access on contact_lists" ON contact_lists FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role access on list_contacts" ON list_contacts FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 10. HELPER FUNCTION: Increment counter
-- ============================================
CREATE OR REPLACE FUNCTION increment_email_counter(row_id UUID, counter_name TEXT)
RETURNS INTEGER AS $$
DECLARE
  current_val INTEGER;
BEGIN
  EXECUTE format('SELECT %I FROM email_sends WHERE id = $1', counter_name)
    INTO current_val USING row_id;
  
  EXECUTE format('UPDATE email_sends SET %I = %I + 1 WHERE id = $1', counter_name, counter_name)
    USING row_id;
  
  RETURN COALESCE(current_val, 0) + 1;
END;
$$ LANGUAGE plpgsql;
