-- Enable the pg_net extension to make HTTP requests
create extension if not exists "pg_net";

-- Create the function that triggers the Edge Function
create or replace function public.handle_discord_notification()
returns trigger as $$
declare
  -- CHANGE THIS URL to your actual deployed Edge Function URL
  -- Example: https://projectref.supabase.co/functions/v1/discord-lead-notifications
  edge_function_url text := 'https://qaeljtxrsujaqnmayhct.supabase.co/functions/v1/discord-lead-notifications';
  
  -- Secret token for auth (Optional: Service Role Key if needed, but we'll use anon for internal trigger if configured)
  -- For better security, pass the service role key in headers: 'Authorization', 'Bearer ' || 'YOUR_SERVICE_ROLE_KEY'
  anon_key text := 'REPLACE_WITH_ANON_KEY_IF_NEEDED'; 
  
  request_body jsonb;
begin
  -- Construct the payload to match Supabase Webhook format roughly
  request_body = jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'schema', TG_TABLE_SCHEMA,
    'record', CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE row_to_json(NEW) END,
    'old_record', CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE row_to_json(OLD) END
  );

  -- Perform the HTTP request asynchronously via pg_net
  perform net.http_post(
      url := edge_function_url,
      headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || anon_key
      ),
      body := request_body
  );

  return new;
end;
$$ language plpgsql security definer;

-- Drop existing trigger if it exists to avoid conflicts
drop trigger if exists on_lead_change_notify_discord on public.leads;

-- Create the trigger
create trigger on_lead_change_notify_discord
after insert or update on public.leads
for each row execute function public.handle_discord_notification();

-- Grant permissions if needed
-- grant execute on function public.handle_discord_notification() to postgres, anon, service_role;
