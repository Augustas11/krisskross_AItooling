-- ============================================
-- Instagram Integration Enhancements
-- Created: 2026-01-08
-- Purpose: Add missing fields for interaction tracking and sync monitoring
-- ============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. ENHANCE INSTAGRAM_INTERACTIONS TABLE
-- ============================================
-- Add fields for tracking message direction, read status, and response tracking

-- Add direction field (inbound from lead, outbound from KrissKross)
ALTER TABLE instagram_interactions 
  ADD COLUMN IF NOT EXISTS direction TEXT CHECK (direction IN ('inbound', 'outbound'));

-- Add read tracking for DMs
ALTER TABLE instagram_interactions 
  ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- Add response tracking (when SDR responded to interaction)
ALTER TABLE instagram_interactions 
  ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ;

-- Add post context for comments
ALTER TABLE instagram_interactions 
  ADD COLUMN IF NOT EXISTS post_url TEXT;

ALTER TABLE instagram_interactions 
  ADD COLUMN IF NOT EXISTS post_thumbnail TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_interactions_direction 
  ON instagram_interactions(direction);

CREATE INDEX IF NOT EXISTS idx_interactions_unread 
  ON instagram_interactions(lead_id, read_at) 
  WHERE read_at IS NULL AND direction = 'inbound';

CREATE INDEX IF NOT EXISTS idx_interactions_needs_response 
  ON instagram_interactions(lead_id, responded_at, instagram_timestamp) 
  WHERE responded_at IS NULL AND direction = 'inbound';

-- Add comments
COMMENT ON COLUMN instagram_interactions.direction IS 'Direction of interaction: inbound (from lead) or outbound (from KrissKross)';
COMMENT ON COLUMN instagram_interactions.read_at IS 'Timestamp when SDR marked interaction as read';
COMMENT ON COLUMN instagram_interactions.responded_at IS 'Timestamp when SDR responded to this interaction';
COMMENT ON COLUMN instagram_interactions.post_url IS 'URL of Instagram post (for comments)';
COMMENT ON COLUMN instagram_interactions.post_thumbnail IS 'Thumbnail URL of Instagram post (for comments)';

-- ============================================
-- 2. ENHANCE INSTAGRAM_CONVERSATIONS TABLE
-- ============================================
-- Add last message preview for quick display

ALTER TABLE instagram_conversations 
  ADD COLUMN IF NOT EXISTS last_message_preview TEXT;

COMMENT ON COLUMN instagram_conversations.last_message_preview IS 'Preview of last message (first 100 characters)';

-- ============================================
-- 3. CREATE INSTAGRAM_SYNC_LOG TABLE
-- ============================================
-- Track sync job execution for monitoring and debugging

CREATE TABLE IF NOT EXISTS instagram_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type TEXT CHECK (sync_type IN ('conversations', 'comments', 'full')) NOT NULL,
  status TEXT CHECK (status IN ('running', 'completed', 'failed')) NOT NULL DEFAULT 'running',
  
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  items_processed INTEGER DEFAULT 0,
  items_matched INTEGER DEFAULT 0,
  items_pending INTEGER DEFAULT 0,
  
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sync_log_status 
  ON instagram_sync_log(status, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_sync_log_type 
  ON instagram_sync_log(sync_type, started_at DESC);

-- Add comments
COMMENT ON TABLE instagram_sync_log IS 'Tracks Instagram sync job execution for monitoring';
COMMENT ON COLUMN instagram_sync_log.sync_type IS 'Type of sync: conversations, comments, or full';
COMMENT ON COLUMN instagram_sync_log.status IS 'Current status: running, completed, or failed';
COMMENT ON COLUMN instagram_sync_log.items_processed IS 'Total number of items processed in this sync';
COMMENT ON COLUMN instagram_sync_log.items_matched IS 'Number of items successfully matched to leads';
COMMENT ON COLUMN instagram_sync_log.items_pending IS 'Number of items added to pending matches queue';

-- ============================================
-- 4. ROW LEVEL SECURITY
-- ============================================
-- Enable RLS on new table

ALTER TABLE instagram_sync_log ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (for backend sync jobs)
CREATE POLICY "Service role full access on sync_log" 
  ON instagram_sync_log FOR ALL 
  USING (true) WITH CHECK (true);

-- ============================================
-- 5. HELPER FUNCTIONS
-- ============================================

-- Function to mark interaction as read
CREATE OR REPLACE FUNCTION mark_interaction_read(interaction_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE instagram_interactions
  SET read_at = NOW()
  WHERE id = interaction_id
    AND read_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark all interactions for a lead as read
CREATE OR REPLACE FUNCTION mark_lead_interactions_read(p_lead_id UUID)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE instagram_interactions
  SET read_at = NOW()
  WHERE lead_id = p_lead_id
    AND direction = 'inbound'
    AND read_at IS NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread count for a lead
CREATE OR REPLACE FUNCTION get_unread_count(p_lead_id UUID)
RETURNS INTEGER AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO unread_count
  FROM instagram_interactions
  WHERE lead_id = p_lead_id
    AND direction = 'inbound'
    AND read_at IS NULL;
  
  RETURN unread_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. DATA MIGRATION
-- ============================================
-- Set default direction for existing records

-- Mark all existing messages as inbound (conservative default)
UPDATE instagram_interactions
SET direction = 'inbound'
WHERE direction IS NULL;

-- Mark messages from instagram_messages table as outbound if they exist
UPDATE instagram_interactions ii
SET direction = 'outbound'
FROM instagram_messages im
WHERE ii.instagram_message_id = im.instagram_message_id
  AND im.direction = 'outbound'
  AND ii.direction = 'inbound';

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- To verify installation, run:
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'instagram_interactions' AND column_name IN ('direction', 'read_at', 'responded_at');
