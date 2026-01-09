-- ============================================
-- COMPLETE Instagram Integration Schema
-- Combined: Base Schema + Enhancements
-- Created: 2026-01-08
-- ============================================
-- Run this COMPLETE file in Supabase SQL Editor
-- This includes both the base Instagram tables AND the Phase 1-2 enhancements

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PART 1: BASE INSTAGRAM TABLES
-- ============================================

-- 1. INSTAGRAM CREDENTIALS TABLE
CREATE TABLE IF NOT EXISTS instagram_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  instagram_account_id TEXT,
  instagram_username TEXT,
  connection_status TEXT CHECK (connection_status IN ('connected', 'disconnected', 'token_expired', 'error')) DEFAULT 'disconnected',
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_instagram_credentials_status ON instagram_credentials(connection_status);

-- 2. INSTAGRAM INTERACTIONS TABLE (with enhancements)
CREATE TABLE IF NOT EXISTS instagram_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id TEXT REFERENCES leads(id) ON DELETE CASCADE,
  interaction_type TEXT CHECK (interaction_type IN ('dm', 'comment', 'mention', 'story_reply')) NOT NULL,
  instagram_user_id TEXT NOT NULL,
  instagram_username TEXT NOT NULL,
  instagram_message_id TEXT,
  instagram_comment_id TEXT,
  message_content TEXT,
  media_url TEXT,
  instagram_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- ENHANCEMENTS (Phase 1-2)
  direction TEXT CHECK (direction IN ('inbound', 'outbound')),
  read_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  post_url TEXT,
  post_thumbnail TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_lead_interactions ON instagram_interactions(lead_id, instagram_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_instagram_user ON instagram_interactions(instagram_username);
CREATE INDEX IF NOT EXISTS idx_interaction_type ON instagram_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_interactions_direction ON instagram_interactions(direction);
CREATE INDEX IF NOT EXISTS idx_interactions_unread ON instagram_interactions(lead_id, read_at) WHERE read_at IS NULL AND direction = 'inbound';
CREATE INDEX IF NOT EXISTS idx_interactions_needs_response ON instagram_interactions(lead_id, responded_at, instagram_timestamp) WHERE responded_at IS NULL AND direction = 'inbound';

COMMENT ON COLUMN instagram_interactions.direction IS 'Direction of interaction: inbound (from lead) or outbound (from KrissKross)';
COMMENT ON COLUMN instagram_interactions.read_at IS 'Timestamp when SDR marked interaction as read';
COMMENT ON COLUMN instagram_interactions.responded_at IS 'Timestamp when SDR responded to this interaction';
COMMENT ON COLUMN instagram_interactions.post_url IS 'URL of Instagram post (for comments)';
COMMENT ON COLUMN instagram_interactions.post_thumbnail IS 'Thumbnail URL of Instagram post (for comments)';

-- 3. INSTAGRAM CONVERSATIONS TABLE (with enhancements)
CREATE TABLE IF NOT EXISTS instagram_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id TEXT REFERENCES leads(id) ON DELETE SET NULL,
  instagram_thread_id TEXT UNIQUE NOT NULL,
  instagram_user_id TEXT NOT NULL,
  instagram_username TEXT NOT NULL,
  last_message_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_message_preview TEXT, -- ENHANCEMENT
  unread_count INTEGER DEFAULT 0,
  status TEXT CHECK (status IN ('active', 'archived', 'needs_response')) DEFAULT 'active',
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_status_updated ON instagram_conversations(status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_conversations ON instagram_conversations(lead_id);
CREATE INDEX IF NOT EXISTS idx_assigned_to ON instagram_conversations(assigned_to);
CREATE INDEX IF NOT EXISTS idx_instagram_thread_id ON instagram_conversations(instagram_thread_id);

COMMENT ON COLUMN instagram_conversations.last_message_preview IS 'Preview of last message (first 100 characters)';

-- 4. INSTAGRAM MESSAGES TABLE
CREATE TABLE IF NOT EXISTS instagram_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES instagram_conversations(id) ON DELETE CASCADE NOT NULL,
  instagram_message_id TEXT UNIQUE NOT NULL,
  direction TEXT CHECK (direction IN ('inbound', 'outbound')) NOT NULL,
  sender_instagram_id TEXT NOT NULL,
  message_text TEXT,
  media_attachments JSONB DEFAULT '[]'::jsonb,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversation_messages ON instagram_messages(conversation_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_instagram_msg_id ON instagram_messages(instagram_message_id);

-- 5. INSTAGRAM PENDING MATCHES TABLE
CREATE TABLE IF NOT EXISTS instagram_pending_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instagram_user_id TEXT NOT NULL,
  instagram_username TEXT NOT NULL,
  interaction_type TEXT NOT NULL,
  message_preview TEXT,
  first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  match_status TEXT CHECK (match_status IN ('pending', 'matched', 'ignored')) DEFAULT 'pending',
  matched_lead_id TEXT REFERENCES leads(id) ON DELETE SET NULL,
  matched_at TIMESTAMP WITH TIME ZONE,
  matched_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_pending_status ON instagram_pending_matches(match_status, first_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_pending_username ON instagram_pending_matches(instagram_username);

-- 6. INSTAGRAM SYNC LOG TABLE (NEW - Phase 1-2)
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

CREATE INDEX IF NOT EXISTS idx_sync_log_status ON instagram_sync_log(status, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_log_type ON instagram_sync_log(sync_type, started_at DESC);

COMMENT ON TABLE instagram_sync_log IS 'Tracks Instagram sync job execution for monitoring';
COMMENT ON COLUMN instagram_sync_log.sync_type IS 'Type of sync: conversations, comments, or full';
COMMENT ON COLUMN instagram_sync_log.status IS 'Current status: running, completed, or failed';
COMMENT ON COLUMN instagram_sync_log.items_processed IS 'Total number of items processed in this sync';
COMMENT ON COLUMN instagram_sync_log.items_matched IS 'Number of items successfully matched to leads';
COMMENT ON COLUMN instagram_sync_log.items_pending IS 'Number of items added to pending matches queue';

-- 7. ADD INSTAGRAM HANDLE TO LEADS TABLE
ALTER TABLE leads ADD COLUMN IF NOT EXISTS instagram_handle TEXT;
CREATE INDEX IF NOT EXISTS idx_leads_instagram_handle ON leads(instagram_handle);
COMMENT ON COLUMN leads.instagram_handle IS 'Instagram username/handle for matching DMs and comments to CRM leads';

-- ============================================
-- PART 2: ROW LEVEL SECURITY
-- ============================================

ALTER TABLE instagram_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_pending_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_sync_log ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role full access on credentials" ON instagram_credentials;
DROP POLICY IF EXISTS "Service role full access on interactions" ON instagram_interactions;
DROP POLICY IF EXISTS "Service role full access on conversations" ON instagram_conversations;
DROP POLICY IF EXISTS "Service role full access on messages" ON instagram_messages;
DROP POLICY IF EXISTS "Service role full access on pending_matches" ON instagram_pending_matches;
DROP POLICY IF EXISTS "Service role full access on sync_log" ON instagram_sync_log;

-- Service role policies (allow backend full access)
CREATE POLICY "Service role full access on credentials" ON instagram_credentials FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on interactions" ON instagram_interactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on conversations" ON instagram_conversations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on messages" ON instagram_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on pending_matches" ON instagram_pending_matches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on sync_log" ON instagram_sync_log FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- PART 3: HELPER FUNCTIONS
-- ============================================

-- Function to update conversation timestamp
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE instagram_conversations 
  SET updated_at = NOW() 
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_conversation_timestamp ON instagram_messages;
CREATE TRIGGER trigger_update_conversation_timestamp
  AFTER INSERT ON instagram_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

-- Function to mark interaction as read (Phase 1-2)
CREATE OR REPLACE FUNCTION mark_interaction_read(interaction_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE instagram_interactions
  SET read_at = NOW()
  WHERE id = interaction_id
    AND read_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark all interactions for a lead as read (Phase 1-2)
CREATE OR REPLACE FUNCTION mark_lead_interactions_read(p_lead_id TEXT)
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

-- Function to get unread count for a lead (Phase 1-2)
CREATE OR REPLACE FUNCTION get_unread_count(p_lead_id TEXT)
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
-- MIGRATION COMPLETE
-- ============================================
-- Verify installation with:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'instagram_%';
