-- Activity Feed Table Migration
-- Purpose: Central event stream for all CRM activities (leads, emails, pitches, status changes)
-- Schema: Optimized for real-time feed display with aggregation support

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create activity_feed table
CREATE TABLE IF NOT EXISTS activity_feed (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Event Classification
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_name VARCHAR(255) NOT NULL, -- Denormalized for performance
  
  action_verb VARCHAR(50) NOT NULL, -- 'created', 'sent', 'updated', 'scheduled', 'enriched', 'moved', 'generated', 'replied', 'won', 'lost'
  action_type VARCHAR(50) NOT NULL, -- 'lead', 'email', 'pitch', 'status_change', 'meeting', 'deal'
  
  -- Entity Reference
  entity_type VARCHAR(50) NOT NULL, -- 'lead', 'deal', 'contact'
  entity_id TEXT NOT NULL,
  entity_name VARCHAR(255), -- Denormalized (e.g., "John's Coffee Shop")
  
  -- Event Metadata
  metadata JSONB DEFAULT '{}', -- Flexible: { subject, recipient, old_status, new_status, fields_updated, etc. }
  
  -- Aggregation Support
  is_aggregated BOOLEAN DEFAULT FALSE,
  aggregation_key TEXT, -- Hash of (actor_id + entity_id + action_verb + time_window)
  aggregated_count INTEGER DEFAULT 1,
  first_occurred_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Filtering
  visibility VARCHAR(20) DEFAULT 'team' CHECK (visibility IN ('private', 'team', 'public')),
  
  -- Performance
  is_read BOOLEAN DEFAULT FALSE,
  priority INTEGER DEFAULT 0 -- For ranking (high-intent actions = higher priority, 0-10)
);

-- Indexes for performance

-- Primary timeline query (most common)
CREATE INDEX IF NOT EXISTS idx_activity_feed_created_at ON activity_feed(created_at DESC);

-- Per-entity timeline (Lead Intelligence Card view)
CREATE INDEX IF NOT EXISTS idx_activity_feed_entity ON activity_feed(entity_id, entity_type);

-- "My Activity" filter
CREATE INDEX IF NOT EXISTS idx_activity_feed_actor ON activity_feed(actor_id);

-- Action type filtering
CREATE INDEX IF NOT EXISTS idx_activity_feed_action_type ON activity_feed(action_type);

-- Aggregation lookup
CREATE INDEX IF NOT EXISTS idx_activity_feed_aggregation ON activity_feed(aggregation_key) 
  WHERE is_aggregated = TRUE;

-- Unread items (partial index saves space)
CREATE INDEX IF NOT EXISTS idx_activity_feed_unread ON activity_feed(actor_id, is_read) 
  WHERE is_read = FALSE;

-- Composite index for common filtered query pattern
CREATE INDEX IF NOT EXISTS idx_activity_feed_timeline ON activity_feed(entity_id, entity_type, created_at DESC);

-- Composite index for action type + time filtering
CREATE INDEX IF NOT EXISTS idx_activity_feed_filters ON activity_feed(action_type, created_at DESC);

-- RLS (Row Level Security)
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (for backend API)
CREATE POLICY "Service role full access on activity_feed" 
  ON activity_feed 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Comments for documentation
COMMENT ON TABLE activity_feed IS 'Centralized event stream for all CRM activities with aggregation support';
COMMENT ON COLUMN activity_feed.actor_id IS 'User who performed the action (NULL for system events)';
COMMENT ON COLUMN activity_feed.action_verb IS 'Human-readable action (created, sent, updated, etc.)';
COMMENT ON COLUMN activity_feed.entity_id IS 'ID of affected resource (lead, deal, contact)';
COMMENT ON COLUMN activity_feed.aggregation_key IS 'Hash key for grouping similar actions within time window';
COMMENT ON COLUMN activity_feed.metadata IS 'Flexible JSONB for action-specific details (email subject, status changes, etc.)';
COMMENT ON COLUMN activity_feed.priority IS '0-10 score for feed ranking (high-intent actions = higher priority)';
