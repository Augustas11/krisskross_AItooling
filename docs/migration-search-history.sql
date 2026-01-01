-- Migration: Add Search History Table
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS search_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  search_url TEXT,
  provider TEXT,
  leads_count INTEGER,
  leads_data JSONB -- Stores the array of leads found in this session
);

-- Index for faster sorting/retrieval
CREATE INDEX IF NOT EXISTS idx_search_history_created_at ON search_history(created_at DESC);
