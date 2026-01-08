# Instagram API Setup Guide

## Overview

This guide covers the setup and configuration of the Instagram Business API integration for KrissKross Leads CRM. This integration enables tracking DMs, comments, and mentions from leads on Instagram.

## Prerequisites

- Instagram Business or Creator account
- Facebook App with Instagram API permissions
- Access tokens configured

## Phase 1: Foundation & Token Verification

### 1. Environment Variables Configuration

#### Local Development

The following environment variables have been added to `.env.local`:

```bash
INSTAGRAM_APP_ID=1187682906764579
INSTAGRAM_APP_SECRET=[REDACTED]
INSTAGRAM_ACCESS_TOKEN=[REDACTED]
```

**⚠️ Security Note:** These variables are already gitignored. Never commit `.env.local` to version control.

#### Production Deployment (Vercel)

Add the same environment variables to your Vercel project:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your `krisskross-aitooling` project
3. Navigate to **Settings** → **Environment Variables**
4. Add each variable:
   - `INSTAGRAM_APP_ID`
   - `INSTAGRAM_APP_SECRET`
   - `INSTAGRAM_ACCESS_TOKEN`
5. Apply to: **Production**, **Preview**, and **Development**
6. Redeploy after adding variables

### 2. Database Migration

Run the Instagram integration SQL migration in your Supabase project:

1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **SQL Editor**
3. Open the migration file:
   ```bash
   cat docs/20250104_instagram_integration.sql
   ```
4. Copy the entire SQL content
5. Paste into Supabase SQL Editor
6. Click **Run** to execute

**Verify installation:**

```sql
-- Check tables created
SELECT table_name 
FROM information_schema.tables  
WHERE table_schema = 'public' 
AND table_name LIKE 'instagram_%';

-- Should return 5 tables:
-- instagram_credentials
-- instagram_interactions
-- instagram_conversations
-- instagram_messages
-- instagram_pending_matches

-- Check instagram_handle added to leads
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'leads' 
AND column_name = 'instagram_handle';
```

### 3. Initialize Instagram Connection

1. Start development server:
   ```bash
   cd /Users/augstar/krisskross_AItooling
   npm run dev
   ```

2. Navigate to admin page:
   ```
   http://localhost:3000/admin/instagram-connection
   ```

3. Click **Initialize Connection** button

4. Verify success:
   - Status changes to "Connected"
   - Instagram username displayed
   - Account ID populated
   - Token expiry shows ~March 4, 2026

### 4. Test Connection

Click **Test Connection** button in admin UI to verify:
- API connectivity
- Token validity
- Required permissions

**Expected permissions:**
- `instagram_basic` ✓
- `instagram_manage_messages` ✓
- `instagram_manage_comments` ✓
- `pages_manage_metadata` ✓
- `pages_read_engagement` ✓

If any permissions are missing, you'll see a warning message.

## File Structure

```
/Users/augstar/krisskross_AItooling/
├── docs/
│   └── 20250104_instagram_integration.sql  # Database migration
├── lib/
│   ├── instagram-api.js                    # Instagram Graph API service
│   └── instagram-lead-matching.js          # Lead matching logic
├── app/
│   └── api/
│       └── instagram/
│           ├── verify-token/route.js       # Token verification endpoint
│           ├── connection-status/route.js  # Status checker endpoint
│           └── test-connection/route.js    # Connection health test
├── components/
│   └── instagram/
│       └── AdminConnection.jsx             # Admin UI component
└── app/
    └── admin/
        └── instagram-connection/
            └── page.js                     # Admin page route
```

## Troubleshooting

### Connection Fails

**Error:** "Failed to verify Instagram token"

**Solutions:**
1. Verify environment variables loaded:
   ```javascript
   console.log(process.env.INSTAGRAM_APP_ID); // In API route
   ```
2. Check token hasn't expired (unlikely with 60-day token)
3. Verify Instagram account is Business/Creator type
4. Check network connectivity to Instagram Graph API

### Database Error

**Error:** "Failed to store credentials in database"

**Solutions:**
1. Verify migration ran successfully
2. Check `instagram_credentials` table exists
3. Verify Supabase service role key configured:
   ```bash
   echo $SUPABASE_SERVICE_ROLE_KEY
   ```

### Missing Permissions

**Warning:** "Missing permissions: instagram_manage_messages"

**Solutions:**
1. Go to [Facebook Developer Dashboard](https://developers.facebook.com/apps/1187682906764579)
2. Navigate to **Instagram** → **Permissions**
3. Request missing permissions
4. Re-generate access token with new permissions
5. Update `INSTAGRAM_ACCESS_TOKEN` in environment variables

## Token Management

### Current Token Details

- **Type:** Long-lived User Access Token
- **Validity:** 60 days from issuance
- **Expires:** ~March 4, 2026
- **Action Required:** Implement token refresh before expiry (Phase 6)

### Token Refresh (Coming in Phase 6)

The current token will expire in 60 days. A token refresh mechanism will be implemented in Phase 6 to automatically renew before expiry.

**Manual token refresh (if needed before Phase 6):**
1. Go to [Facebook Graph API Explorer](https://developers.facebook.com/tools/explorer)
2. Select your Facebook App
3. Get new long-lived token
4. Update `INSTAGRAM_ACCESS_TOKEN` environment variable
5. Click "Initialize Connection" again in admin UI

## Next Steps

After completing Phase 1 setup:

- **Phase 2:** Webhook receiver for real-time DM/comment events
- **Phase 3:** Instagram section in IntelligenceCard
- **Phase 4:** SDR Conversation Dashboard for managing DMs
- **Phase 5:** Comment tracking UI
- **Phase 6:** Analytics dashboard and token refresh automation

## Security Best Practices

1. **Never commit credentials:**
   - `.env.local` is gitignored
   - Don't hardcode tokens in code
   - Don't share tokens in chat/email

2. **Access token storage:**
   - Currently stored unencrypted in database
   - TODO: Implement encryption in production (use Supabase Vault)

3. **API rate limits:**
   - Instagram API: 200 calls/hour
   - Monitor usage in admin dashboard (Phase 6)

4. **Row Level Security:**
   - All Instagram tables have RLS enabled
   - Service role has full access
   - Future: Add user-level policies for SDR access

## Support

For issues or questions:
- Check [Instagram Graph API Documentation](https://developers.facebook.com/docs/instagram-api)
- Review server logs for API errors
- Contact development team

---

**Last Updated:** January 4, 2026  
**Phase:** 1 - Foundation & Token Verification  
**Status:** Complete ✓
