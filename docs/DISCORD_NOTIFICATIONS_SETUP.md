# Discord Notifications Setup Guide

This guide explains how to deploy and configure the Discord notifications system for KrissKross CRM.

## Prerequisites
- Supabase CLI installed and logged in.
- A Discord Webhook URL (from your Discord App settings).

## 1. Deploy the Edge Function

Run the following command in your terminal to deploy the function to Supabase:

```bash
supabase functions deploy discord-lead-notifications --no-verify-jwt
```

> **Note**: `--no-verify-jwt` is used if you want to call this function from a database trigger without passing a user JWT. However, for security, it is often better to enforce JWT verification and pass the service role key. The provided code handles basic auth, but ensure you configure your function settings in the Supabase Dashboard if needed.

## 2. Configure Environment Variables

```bash
supabase secrets set DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR/WEBHOOK/URL
```

### 2a. Set CRM Base URL (New!)
To enable deep-linking to specific leads from Discord, set your CRM's public URL:

```bash
supabase secrets set CRM_BASE_URL=https://your-app.vercel.app
```

To verify it's set:
```bash
supabase secrets list
```

## 3. Create Database Trigger

You need to create the trigger that calls the function whenever the `leads` table changes.

1. Go to the **Supabase Dashboard** -> **SQL Editor**.
2. Open the file `supabase/migrations/trigger_setup.sql` (or copy its content).
3. **IMPORTANT**: Edit line 8 of the SQL to match your project's Edge Function URL.
   - It usually looks like: `https://[PROJECT_REF].supabase.co/functions/v1/discord-lead-notifications`
   - You can find `[PROJECT_REF]` in your Supabase Dashboard settings.
4. Run the SQL script.

## 4. Verification

Use the provided testing script to verify everything is working.

1. Go to **Supabase Dashboard** -> **SQL Editor**.
2. Copy content from `scripts/test_discord_notifications.sql`.
3. Run the script entirely or step-by-step.
4. Check your Discord channel `#krisskross-leads`.

### Expected Results

- **Insert Lead**: You should see a "🆕 New Lead Entered" message.
- **Update to Pitched**: You should see a "📧 Lead Status Changed" message.
- **Update to Replied**: You should see a "💬 Lead Replied! 🔥" message.
