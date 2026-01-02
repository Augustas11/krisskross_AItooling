-- Migration: Add App Settings Table
-- Part of Phase 3: Sales Efficiency Tools

-- 1. Create app_settings table for global config (like Calendly link)
CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Insert default empty Calendly link if not exists
INSERT INTO app_settings (key, value)
VALUES ('calendly_link', '"https://calendly.com/"')
ON CONFLICT (key) DO NOTHING;

-- 3. Enable RLS but allow public access for this single-user app (or restricted if auth existed)
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access to app_settings" ON app_settings
    FOR ALL
    USING (true)
    WITH CHECK (true);
