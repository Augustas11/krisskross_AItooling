-- Migration: Fix Function Search Path Security Warnings
-- Created: 2026-01-07
-- Purpose: Set immutable search_path on functions to prevent search_path injection attacks
-- Issue: Functions without explicit search_path can be vulnerable to schema injection
--
-- Reference: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable

-- ============================================
-- 1. FIX handle_discord_notification FUNCTION
-- ============================================
-- Recreate with SET search_path = public

CREATE OR REPLACE FUNCTION public.handle_discord_notification()
RETURNS trigger AS $$
DECLARE
  edge_function_url text := 'https://qaeljtxrsujaqnmayhct.supabase.co/functions/v1/discord-lead-notifications';
  anon_key text := 'REPLACE_WITH_ANON_KEY_IF_NEEDED'; 
  request_body jsonb;
BEGIN
  request_body = jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'schema', TG_TABLE_SCHEMA,
    'record', CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE row_to_json(NEW) END,
    'old_record', CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE row_to_json(OLD) END
  );

  PERFORM net.http_post(
      url := edge_function_url,
      headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || anon_key
      ),
      body := request_body
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql 
   SECURITY DEFINER
   SET search_path = public;

-- ============================================
-- 2. FIX handle_slack_notification FUNCTION
-- ============================================
-- This function exists in DB but not in repo - recreate with same pattern

CREATE OR REPLACE FUNCTION public.handle_slack_notification()
RETURNS trigger AS $$
DECLARE
  edge_function_url text := 'https://qaeljtxrsujaqnmayhct.supabase.co/functions/v1/slack-lead-notifications';
  anon_key text := 'REPLACE_WITH_ANON_KEY_IF_NEEDED'; 
  request_body jsonb;
BEGIN
  request_body = jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'schema', TG_TABLE_SCHEMA,
    'record', CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE row_to_json(NEW) END,
    'old_record', CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE row_to_json(OLD) END
  );

  PERFORM net.http_post(
      url := edge_function_url,
      headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || anon_key
      ),
      body := request_body
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql 
   SECURITY DEFINER
   SET search_path = public;

-- ============================================
-- 3. FIX exec_sql FUNCTION
-- ============================================
-- Helper function for running migrations - add search_path

CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result json;
BEGIN
    EXECUTE sql;
    RETURN json_build_object('success', true, 'message', 'SQL executed successfully');
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Ensure grants remain in place
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO anon, authenticated;

-- ============================================
-- 4. MOVE pg_net EXTENSION TO extensions SCHEMA (OPTIONAL)
-- ============================================
-- Note: Moving extensions can be risky. The pg_net extension is used by triggers.
-- Supabase recommends using the 'extensions' schema.
-- 
-- CAUTION: Only uncomment if you're prepared to update all references to net.http_post
-- 
-- DROP EXTENSION IF EXISTS pg_net;
-- CREATE EXTENSION pg_net SCHEMA extensions;
-- 
-- If you do this, you'll need to update the function calls from:
--   net.http_post(...) 
-- to:
--   extensions.net.http_post(...)

-- ============================================
-- VERIFICATION
-- ============================================
-- After running, verify with:
-- SELECT proname, prosecdef, proconfig 
-- FROM pg_proc 
-- WHERE proname IN ('handle_discord_notification', 'handle_slack_notification', 'exec_sql')
--   AND pronamespace = 'public'::regnamespace;
--
-- proconfig should now include: {search_path=public}
