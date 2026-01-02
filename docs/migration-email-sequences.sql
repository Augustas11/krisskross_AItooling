-- Migration: Email Sequences System
-- Run this in your Supabase SQL Editor

-- 1. Create email_sequences table
CREATE TABLE IF NOT EXISTS email_sequences (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  sequence_type TEXT NOT NULL, -- 'cold_outreach', 'trial_nurture', etc.
  emails JSONB NOT NULL, -- Array of email templates
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create email_sequence_enrollments table
CREATE TABLE IF NOT EXISTS email_sequence_enrollments (
  id SERIAL PRIMARY KEY,
  lead_id TEXT REFERENCES leads(id) ON DELETE CASCADE,
  sequence_id INTEGER REFERENCES email_sequences(id),
  current_step INTEGER DEFAULT 1,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_email_sent_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  unenrolled_at TIMESTAMP WITH TIME ZONE,
  unenroll_reason TEXT, -- 'replied', 'unsubscribed', 'manual', 'completed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_enrollments_lead ON email_sequence_enrollments(lead_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_active ON email_sequence_enrollments(lead_id) 
  WHERE completed_at IS NULL AND unenrolled_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_enrollments_processing ON email_sequence_enrollments(last_email_sent_at)
  WHERE completed_at IS NULL AND unenrolled_at IS NULL;

-- 4. Add new columns to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS in_sequence BOOLEAN DEFAULT FALSE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS sequence_paused BOOLEAN DEFAULT FALSE;

-- 5. Seed default "Cold Outreach Follow-up" sequence
INSERT INTO email_sequences (name, description, sequence_type, emails) VALUES (
  'Cold Outreach Follow-up',
  'Automated 3-email follow-up sequence for cold leads',
  'cold_outreach',
  '[
    {
      "step": 1,
      "delay_days": 0,
      "subject": "Quick question about {{business_category}}",
      "body": "Hi {{name}},\n\nI came across your {{business_category}} brand on Instagram (@{{instagram}}) and was really impressed by your products!\n\nI noticed you''re creating content manually - we built KrissKross to help brands like yours turn product photos into professional TikTok Shop videos in seconds (no editing skills needed).\n\nWould you be open to a quick 5-minute demo? I can show you how other {{business_category}} brands are using it to 3x their engagement.\n\nBest,\nAug\nFounder, KrissKross"
    },
    {
      "step": 2,
      "delay_days": 2,
      "subject": "Re: Quick question about {{business_category}}",
      "body": "Hi {{name}},\n\nJust wanted to follow up on my email from a couple days ago.\n\nI know you''re busy, so I''ll keep this short: KrissKross can save you 5+ hours per week on video content creation.\n\nHere''s a 60-second demo: https://krisskross.ai/demo\n\nWorth a look?\n\nAug"
    },
    {
      "step": 3,
      "delay_days": 5,
      "subject": "Should I close your file?",
      "body": "Hi {{name}},\n\nI haven''t heard back, so I''m guessing now''s not the right time.\n\nNo worries at all! If you''d like me to check back in a few months, just reply \"Not now\" and I''ll follow up later.\n\nOr if you''re interested in seeing how KrissKross can help {{business_category}} brands like yours, let''s chat: https://calendly.com/krisskross\n\nEither way, best of luck with your business!\n\nAug"
    }
  ]'::jsonb
) ON CONFLICT DO NOTHING;

-- 6. Enable Row Level Security (if needed)
ALTER TABLE email_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sequence_enrollments ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (adjust based on your auth needs)
CREATE POLICY "Allow all operations on sequences" ON email_sequences
    FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all operations on enrollments" ON email_sequence_enrollments
    FOR ALL
    USING (true)
    WITH CHECK (true);
