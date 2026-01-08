# Instagram Access Token Refresh Guide

## Current Issue

The Instagram access token provided is being rejected by Instagram with error:
```
OAuthException: API access blocked (Code 200)
```

This means the token is either expired, revoked, or not properly authorized.

## Solution: Get a Fresh Access Token

### Option 1: Quick Token Refresh (Recommended)

1. **Go to Facebook Graph API Explorer:**
   https://developers.facebook.com/tools/explorer

2. **Select Your App:**
   - Click dropdown next to "Graph API Explorer"
   - Select your app: `1187682906764579`

3. **Get Access Token:**
   - Click "Generate Access Token"
   - Select these permissions:
     - `instagram_basic`
     - `instagram_manage_messages`
     - `instagram_manage_comments`
     - `pages_manage_metadata`
     - `pages_read_engagement`
     - `pages_messaging`

4. **Generate Long-Lived Token:**
   After getting the short-lived token, convert it to long-lived (60 days):
   
   ```bash
   curl -i -X GET "https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=1187682906764579&client_secret=[REDACTED]&fb_exchange_token=SHORT_LIVED_TOKEN"
   ```

5. **Update .env.local:**
   Replace `INSTAGRAM_ACCESS_TOKEN` with the new long-lived token

6. **Test:**
   ```bash
   node scripts/test-instagram-token.js
   ```

### Option 2: Manual Facebook App Setup

1. **Check App Dashboard:**
   https://developers.facebook.com/apps/1187682906764579/dashboard

2. **Verify Instagram Product Added:**
   - Settings → Products
   - Ensure "Instagram" is added

3. **Check Permissions:**
   - App Review → Permissions and Features
   - Ensure Instagram permissions are approved

4. **Connect Instagram Account:**
   - Instagram → Settings
   - Connect your Instagram Business account
   - Authorize all requested permissions

### Option 3: Create New Test Token

For testing purposes, you can use the Facebook Login Flow to get a token:

1. Go to: https://developers.facebook.com/docs/instagram-basic-display-api/guides/getting-access-tokens-and-permissions

2. Follow the Authorization Window flow

3. Use the returned access token

## Common Issues

### "API access blocked"
- **Cause:** Token expired, revoked, or invalid permissions
- **Fix:** Generate new token with correct permissions

### "Invalid OAuth access token"
- **Cause:** Token is malformed or doesn't belong to your app
- **Fix:** Ensure token was generated for App ID 1187682906764579

### "Permissions error"
- **Cause:** Missing required Instagram permissions
- **Fix:** Request all required permissions when generating token

## Testing Your New Token

After getting a new token, test it:

```bash
# 1. Update .env.local with new token

# 2. Test token
node scripts/test-instagram-token.js

# 3. If successful, initialize connection at:
http://localhost:3001/admin/instagram-connection
```

## Token Lifecycle

- **Short-lived tokens:** Valid for ~1 hour
- **Long-lived tokens:** Valid for 60 days
- **Refresh required:** Before expiry (we'll automate this in Phase 6)

## Important Notes

- Keep tokens secure (never commit to git)
- Long-lived tokens must be refreshed every 60 days
- Instagram Business account must remain connected to Facebook Page
- App must have Instagram Graph API product enabled

---

**Need Help?**
- Facebook Instagram API Docs: https://developers.facebook.com/docs/instagram-api
- Token Generation Guide: https://developers.facebook.com/docs/facebook-login/guides/access-tokens
