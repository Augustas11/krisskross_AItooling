-- Migration: Add Trial User Rescue Sequence
-- Part of Phase 2: Advanced Nurture Sequences

-- 0. Ensure schema supports is_active and unique sequence_type
ALTER TABLE email_sequences ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'email_sequences_sequence_type_key') THEN
        ALTER TABLE email_sequences ADD CONSTRAINT email_sequences_sequence_type_key UNIQUE (sequence_type);
    END IF;
END
$$;

-- 1. Insert the Trial Onboarding Sequence
-- This sequence targets users who signed up for a trial but haven't engaged effectively.

INSERT INTO email_sequences (name, sequence_type, description, is_active, emails)
VALUES (
    'Trial User Rescue',
    'trial_onboarding',
    'Automated nurturing for new trial signups to drive conversion to paid.',
    true,
    jsonb_build_array(
        jsonb_build_object(
            'step', 1,
            'delay_days', 0,
            'subject', 'Welcome to KrissKross! (Quick tip inside)',
            'body', 'Hi {{name}},\n\nWelcome to KrissKross! I saw you just signed up.\n\nMost new users get their first video ready in under 5 minutes. Here is the fasted way to do it:\n\n1. Paste your store URL\n2. Click "Generate"\n3. Download your video\n\nIf you get stuck, just reply to this email. I am here to help.\n\nCheers,\nFounder'
        ),
        jsonb_build_object(
            'step', 2,
            'delay_days', 2,
            'subject', 'How to get 10x more views with your videos',
            'body', 'Hi {{name}},\n\nI noticed you haven''t exported your first video yet (or maybe you just started).\n\nHere is a quick case study: One of our users, Sarah, used the "Viral Hook" template and saw a 300% increase in views on TikTok overnight.\n\nWant to try it?\n\n[Link to Templates]\n\nLet me know if you need help picking the right style for your brand.\n\nBest,'
        ),
        jsonb_build_object(
            'step', 3,
            'delay_days', 4,
            'subject', 'Everything okay?',
            'body', 'Hi {{name}},\n\nJust checking in. I see you are still on the trial plan.\n\nIs there anything specific holding you back from using KrissKross to automate your video content?\n\n- Need more templates?\n- Quality concerns?\n- Pricing?\n\nJust hit reply and let me know. I read every email.\n\nThanks,'
        ),
        jsonb_build_object(
            'step', 4,
            'delay_days', 7,
            'subject', 'Last day to unlock your special offer',
            'body', 'Hi {{name}},\n\nYour trial is ending soon.\n\nAs a thank you for trying us out, I want to offer you 50% off your first month if you upgrade today.\n\nCode: TRIAL50\n\n[Link to Upgrade]\n\nDon''t let your social feed go quiet!\n\nCheers,'
        )
    )
)
ON CONFLICT (sequence_type) 
DO UPDATE SET 
    emails = EXCLUDED.emails,
    name = EXCLUDED.name,
    description = EXCLUDED.description;
