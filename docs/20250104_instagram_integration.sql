-- ============================================
-- Instagram API Integration - Database Schema
-- Created: 2026-01-04
-- ============================================
-- This migration creates all tables needed for Instagram Business API integration
-- Including DM tracking, comment tracking, conversation management, and lead matching

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. INSTAGRAM CREDENTIALS TABLE
-- ============================================
-- Stores Instagram API credentials and connection status
CREATE TABLE IF NOT EXISTS instagram_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_id TEXT NOT NULL,
  access_token TEXT NOT NULL, -- TODO: Encrypt this field in production
  token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  instagram_account_id TEXT,
  instagram_username TEXT,
  connection_status TEXT CHECK (connection_status IN ('connected', 'disconnected', 'token_expired', 'error')) DEFAULT 'disconnected',
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_instagram_credentials_status ON instagram_credentials(connection_status);

-- ============================================
-- 2. INSTAGRAM INTERACTIONS TABLE
-- ============================================
-- Tracks all Instagram interactions (DMs, comments, mentions) linked to leads
CREATE TABLE IF NOT EXISTS instagram_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  interaction_type TEXT CHECK (interaction_type IN ('dm', 'comment', 'mention', 'story_reply')) NOT NULL,
  instagram_user_id TEXT NOT NULL,
  instagram_username TEXT NOT NULL,
  message_content TEXT,
  media_url TEXT,
  instagram_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_lead_interactions ON instagram_interactions(lead_id, instagram_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_instagram_user ON instagram_interactions(instagram_username);
CREATE INDEX IF NOT EXISTS idx_interaction_type ON instagram_interactions(interaction_type);

-- ============================================
-- 3. INSTAGRAM CONVERSATIONS TABLE
-- ============================================
-- Manages DM conversation threads with leads
CREATE TABLE IF NOT EXISTS instagram_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  instagram_thread_id TEXT UNIQUE NOT NULL,
  instagram_user_id TEXT NOT NULL,
  instagram_username TEXT NOT NULL,
  last_message_at TIMESTAMP WITH TIME ZONE NOT NULL,
  unread_count INTEGER DEFAULT 0,
  status TEXT CHECK (status IN ('active', 'archived', 'needs_response')) DEFAULT 'active',
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_status_updated ON instagram_conversations(status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_conversations ON instagram_conversations(lead_id);
CREATE INDEX IF NOT EXISTS idx_assigned_to ON instagram_conversations(assigned_to);
CREATE INDEX IF NOT EXISTS idx_instagram_thread_id ON instagram_conversations(instagram_thread_id);

-- ============================================
-- 4. INSTAGRAM MESSAGES TABLE
-- ============================================
-- Stores full conversation history for all DMs
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

-- ============================================
-- 5. INSTAGRAM PENDING MATCHES TABLE
-- ============================================
-- Stores unmatched Instagram interactions for manual linking
CREATE TABLE IF NOT EXISTS instagram_pending_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instagram_user_id TEXT NOT NULL,
  instagram_username TEXT NOT NULL,
  interaction_type TEXT NOT NULL,
  message_preview TEXT,
  first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  match_status TEXT CHECK (match_status IN ('pending', 'matched', 'ignored')) DEFAULT 'pending',
  matched_lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  matched_at TIMESTAMP WITH TIME ZONE,
  matched_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_pending_status ON instagram_pending_matches(match_status, first_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_pending_username ON instagram_pending_matches(instagram_username);

-- ============================================
-- 6. ADD INSTAGRAM HANDLE TO LEADS TABLE
-- ============================================
-- Add instagram_handle field if it doesn't exist
ALTER TABLE leads ADD COLUMN IF NOT EXISTS instagram_handle TEXT;

-- Create index for fast matching
CREATE INDEX IF NOT EXISTS idx_leads_instagram_handle ON leads(instagram_handle);

-- Add comment
COMMENT ON COLUMN leads.instagram_handle IS 'Instagram username/handle for matching DMs and comments to CRM leads';

-- ============================================
-- 7. ROW LEVEL SECURITY POLICIES
-- ============================================
-- Enable RLS on all Instagram tables
ALTER TABLE instagram_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_pending_matches ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (for backend API)
CREATE POLICY "Service role full access on credentials" 
  ON instagram_credentials FOR ALL 
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on interactions" 
  ON instagram_interactions FOR ALL 
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on conversations" 
  ON instagram_conversations FOR ALL 
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on messages" 
  ON instagram_messages FOR ALL 
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on pending_matches" 
  ON instagram_pending_matches FOR ALL 
  USING (true) WITH CHECK (true);

-- ============================================
-- 8. HELPER FUNCTIONS
-- ============================================

-- Function to update conversation updated_at timestamp
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE instagram_conversations 
  SET updated_at = NOW() 
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update conversation timestamp when message added
DROP TRIGGER IF EXISTS trigger_update_conversation_timestamp ON instagram_messages;
CREATE TRIGGER trigger_update_conversation_timestamp
  AFTER INSERT ON instagram_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- To verify installation, run:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_name LIKE 'instagram_%';
