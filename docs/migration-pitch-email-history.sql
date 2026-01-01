-- Migration: Add Pitch and Email History Tables
-- Run this in your Supabase SQL Editor

-- Table for generated pitches
CREATE TABLE IF NOT EXISTS pitch_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  lead_name TEXT,
  lead_email TEXT,
  context TEXT,
  generated_pitch TEXT,
  target_type TEXT, -- e.g., 'fashion-seller', 'manual'
  was_ai_generated BOOLEAN DEFAULT FALSE
);

-- Table for sent emails
CREATE TABLE IF NOT EXISTS email_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  recipient_email TEXT,
  subject TEXT,
  body TEXT,
  lead_id TEXT, -- Optional link to leads table
  status TEXT DEFAULT 'sent' -- 'sent', 'failed'
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pitch_history_created_at ON pitch_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_history_sent_at ON email_history(sent_at DESC);
