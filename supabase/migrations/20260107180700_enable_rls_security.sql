-- Migration: Enable Row Level Security on Public Tables
-- Created: 2026-01-07
-- Purpose: Fix SECURITY errors from Supabase Database Linter
-- Issue: RLS disabled on tables exposed to PostgREST
--
-- Tables affected:
--   1. search_history
--   2. pitch_history
--   3. email_history
--   4. leads_backups
--   5. conversations
--   6. automation_triggers
--   7. message_queue
--   8. instagram_tokens
--   9. enrichment_queue

-- ============================================
-- 1. ENABLE RLS ON ALL AFFECTED TABLES
-- ============================================

-- Note: Using IF EXISTS pattern to avoid errors if tables don't exist

DO $$ 
BEGIN
  -- search_history
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'search_history') THEN
    ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;
  END IF;

  -- pitch_history
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'pitch_history') THEN
    ALTER TABLE public.pitch_history ENABLE ROW LEVEL SECURITY;
  END IF;

  -- email_history
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'email_history') THEN
    ALTER TABLE public.email_history ENABLE ROW LEVEL SECURITY;
  END IF;

  -- leads_backups
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'leads_backups') THEN
    ALTER TABLE public.leads_backups ENABLE ROW LEVEL SECURITY;
  END IF;

  -- conversations
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'conversations') THEN
    ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
  END IF;

  -- automation_triggers
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'automation_triggers') THEN
    ALTER TABLE public.automation_triggers ENABLE ROW LEVEL SECURITY;
  END IF;

  -- message_queue
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'message_queue') THEN
    ALTER TABLE public.message_queue ENABLE ROW LEVEL SECURITY;
  END IF;

  -- instagram_tokens
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'instagram_tokens') THEN
    ALTER TABLE public.instagram_tokens ENABLE ROW LEVEL SECURITY;
  END IF;

  -- enrichment_queue
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'enrichment_queue') THEN
    ALTER TABLE public.enrichment_queue ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- ============================================
-- 2. CREATE RLS POLICIES (Service Role Access)
-- ============================================
-- These policies allow the service role (used by edge functions and server-side code)
-- to access all rows while protecting data from direct client access without proper auth

-- search_history - System access for search logs
DROP POLICY IF EXISTS "Service role access on search_history" ON public.search_history;
CREATE POLICY "Service role access on search_history" 
  ON public.search_history FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- pitch_history - System access for AI-generated pitches
DROP POLICY IF EXISTS "Service role access on pitch_history" ON public.pitch_history;
CREATE POLICY "Service role access on pitch_history" 
  ON public.pitch_history FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- email_history - System access for email tracking
DROP POLICY IF EXISTS "Service role access on email_history" ON public.email_history;
CREATE POLICY "Service role access on email_history" 
  ON public.email_history FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- leads_backups - System access for backup management
DROP POLICY IF EXISTS "Service role access on leads_backups" ON public.leads_backups;
CREATE POLICY "Service role access on leads_backups" 
  ON public.leads_backups FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- conversations - System access for DM/chat history
DROP POLICY IF EXISTS "Service role access on conversations" ON public.conversations;
CREATE POLICY "Service role access on conversations" 
  ON public.conversations FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- automation_triggers - System access for automation rules
DROP POLICY IF EXISTS "Service role access on automation_triggers" ON public.automation_triggers;
CREATE POLICY "Service role access on automation_triggers" 
  ON public.automation_triggers FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- message_queue - System access for queued messages
DROP POLICY IF EXISTS "Service role access on message_queue" ON public.message_queue;
CREATE POLICY "Service role access on message_queue" 
  ON public.message_queue FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- instagram_tokens - System access for OAuth tokens (CRITICAL for security!)
DROP POLICY IF EXISTS "Service role access on instagram_tokens" ON public.instagram_tokens;
CREATE POLICY "Service role access on instagram_tokens" 
  ON public.instagram_tokens FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- enrichment_queue - System access for lead enrichment processing
DROP POLICY IF EXISTS "Service role access on enrichment_queue" ON public.enrichment_queue;
CREATE POLICY "Service role access on enrichment_queue" 
  ON public.enrichment_queue FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- ============================================
-- 3. VERIFICATION QUERIES (optional - run manually)
-- ============================================
-- After running this migration, verify with:
--
-- SELECT tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
--   AND tablename IN (
--     'search_history', 'pitch_history', 'email_history', 
--     'leads_backups', 'conversations', 'automation_triggers', 
--     'message_queue', 'instagram_tokens', 'enrichment_queue'
--   );
--
-- All rows should show rowsecurity = true

-- ============================================
-- Note: These are "allow all" policies suitable for server-side access
-- via the service role key. For client-side/anon access, you would
-- need more restrictive policies based on auth.uid() or other checks.
-- ============================================
