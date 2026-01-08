-- Instagram Real-time Triggers
-- SQL triggers to support Supabase Realtime functionality

-- Function: Update conversation unread count and last message time
CREATE OR REPLACE FUNCTION increment_unread_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Only increment for inbound messages
  IF NEW.direction = 'inbound' THEN
    UPDATE instagram_conversations
    SET unread_count = unread_count + 1,
        last_message_at = NEW.sent_at,
        status = 'needs_response',
        updated_at = NOW()
    WHERE id = NEW.conversation_id;
  ELSE
    -- For outbound messages, just update last_message_at
    UPDATE instagram_conversations
    SET last_message_at = NEW.sent_at,
        status = 'active',
        updated_at = NOW()
    WHERE id = NEW.conversation_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on new message
DROP TRIGGER IF EXISTS on_new_message ON instagram_messages;
CREATE TRIGGER on_new_message
  AFTER INSERT ON instagram_messages
  FOR EACH ROW
  EXECUTE FUNCTION increment_unread_count();

-- Function: Reset unread count when conversation is viewed
CREATE OR REPLACE FUNCTION reset_unread_on_view()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.unread_count = 0 AND OLD.unread_count > 0 THEN
    NEW.updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on conversation update
DROP TRIGGER IF EXISTS on_conversation_viewed ON instagram_conversations;
CREATE TRIGGER on_conversation_viewed
  BEFORE UPDATE ON instagram_conversations
  FOR EACH ROW
  EXECUTE FUNCTION reset_unread_on_view();

-- Add responded_at column to instagram_interactions if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'instagram_interactions' 
    AND column_name = 'responded_at'
  ) THEN
    ALTER TABLE instagram_interactions 
    ADD COLUMN responded_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Add response_metadata column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'instagram_interactions' 
    AND column_name = 'response_metadata'
  ) THEN
    ALTER TABLE instagram_interactions 
    ADD COLUMN response_metadata JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Create index for comment responses
CREATE INDEX IF NOT EXISTS idx_comment_responses 
ON instagram_interactions(interaction_type, responded_at) 
WHERE interaction_type = 'comment';

-- Enable Row Level Security (if not already enabled)
ALTER TABLE instagram_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_interactions ENABLE ROW LEVEL SECURITY;

-- Create policies for Realtime (allow all for authenticated users)
DROP POLICY IF EXISTS "Allow all for authenticated users" ON instagram_messages;
CREATE POLICY "Allow all for authenticated users" 
ON instagram_messages FOR ALL 
USING (true);

DROP POLICY IF EXISTS "Allow all for authenticated users" ON instagram_conversations;
CREATE POLICY "Allow all for authenticated users" 
ON instagram_conversations FOR ALL 
USING (true);

DROP POLICY IF EXISTS "Allow all for authenticated users" ON instagram_interactions;
CREATE POLICY "Allow all for authenticated users" 
ON instagram_interactions FOR ALL 
USING (true);

-- Instructions for enabling Realtime in Supabase Dashboard:
-- 1. Go to https://app.supabase.com/project/{project-id}/database/publications
-- 2. Enable Realtime for tables:
--    - instagram_messages
--    - instagram_conversations  
--    - instagram_interactions
-- 3. Select events: INSERT, UPDATE, DELETE
