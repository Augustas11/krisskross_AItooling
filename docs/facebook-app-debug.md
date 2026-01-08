# Facebook App Debug Checklist for Instagram API

This guide walks through systematic debugging of your Facebook App setup to identify why the Instagram API token is being blocked.

## Quick Diagnostic Steps

### Step 1: Verify App Exists and You Have Access

**Check:** Can you access the app dashboard?

1. Open: https://developers.facebook.com/apps/1187682906764579/dashboard
2. Can you see the app details? (Yes/No)
3. What's the app status shown? (Development/Live)

**If you can't access:**
- You may not have admin permissions to this app
- The app might have been deleted
- You might be logged into the wrong Facebook account

---

### Step 2: Check Instagram Product Configuration

**Check:** Is Instagram properly added to your app?

1. Go to: https://developers.facebook.com/apps/1187682906764579/instagram-basic-display/basic-display/
2. Or: Dashboard → Products → Instagram (should be in the sidebar)

**What to verify:**
- [ ] Instagram product is added (appears in left sidebar)
- [ ] Instagram Business Account is connected
- [ ] Client OAuth Settings are configured

**Common issues:**
- Instagram product not added → Add it from "Add Product" button
- No Instagram account connected → Connect your Business account
- Wrong account type → Must be Business or Creator account

---

### Step 3: Verify Instagram Business Account Connection

**Check:** Is your Instagram account properly linked?

1. Go to: https://developers.facebook.com/apps/1187682906764579/instagram-graph-api/basic-settings/
2. Check: "Instagram Business Account" field

**What you should see:**
- Instagram username displayed
- Instagram account ID shown
- "Connected" status

**If not connected:**
1. Click "Connect Instagram Account"
2. Select your Instagram Business account
3. Authorize all permissions
4. Ensure the Instagram account is linked to a Facebook Page

🔴 **Critical:** Your Instagram account MUST be a Business or Creator account, and it MUST be connected to a Facebook Page

---

### Step 4: Check App Permissions and Approval Status

**Check:** Does your app have the required permissions?

1. Go to: https://developers.facebook.com/apps/1187682906764579/app-review/permissions/
2. Look for these Instagram permissions:

**Required permissions:**
- [ ] `instagram_basic` - Status: ?
- [ ] `instagram_manage_messages` - Status: ?
- [ ] `instagram_manage_comments` - Status: ?
- [ ] `pages_manage_metadata` - Status: ?
- [ ] `pages_read_engagement` - Status: ?

**Permission states:**
- ✅ **Granted** - Good, working
- ⚠️ **Pending Review** - App Review needed for live mode
- ❌ **Not Requested** - Need to request this permission

**For Development Mode:**
- Permissions should work without App Review
- Must be admin/developer/tester on the app
- Instagram account must be in test mode

**For Live Mode:**
- Must submit app for App Review
- Business Verification may be required
- Can take several weeks for approval

---

### Step 5: Check App Mode (Development vs Live)

**Check:** What mode is your app in?

1. Go to: https://developers.facebook.com/apps/1187682906764579/settings/basic/
2. Look for "App Mode" toggle

**Development Mode:**
- App works only for developers/testers
- No App Review needed
- Limited to test accounts
- ✅ **This is probably what you need for testing**

**Live Mode:**
- Works for all users
- Requires App Review approval
- Requires Business Verification
- May have additional restrictions

**Action:** If in Live mode without approval, switch to Development mode for testing

---

### Step 6: Verify Test Users/Roles

**Check:** Are you added as an app developer/tester?

1. Go to: https://developers.facebook.com/apps/1187682906764579/roles/
2. Check if your Facebook account is listed under:
   - Administrators
   - Developers
   - Testers

**Also check Instagram Testers:**
1. Go to: https://developers.facebook.com/apps/1187682906764579/instagram-basic-display/instagram-testers/
2. Is your Instagram account added as a tester?

**If not listed:**
- You won't be able to use the API in Development mode
- Another admin needs to add you
- Add your Instagram account as a tester

---

### Step 7: Generate Fresh Access Token

**Check:** Create a new token from scratch

**Method 1: Graph API Explorer (Easiest)**

1. Go to: https://developers.facebook.com/tools/explorer
2. Select "Instagram Graph API" from dropdown
3. Select your app: "1187682906764579"
4. Click "Generate Access Token"
5. Check these permissions:
   - instagram_basic
   - instagram_manage_messages
   - instagram_manage_comments
   - pages_manage_metadata
   - pages_read_engagement
6. Click "Generate Access Token"
7. Copy the token (short-lived, ~1 hour)

**Method 2: Convert to Long-Lived Token**

After getting short-lived token from Graph Explorer, convert it:

```bash
curl "https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=1187682906764579&client_secret=24cdcf261b0cbbacac0063638c0ecef6&fb_exchange_token=YOUR_SHORT_LIVED_TOKEN"
```

This returns a long-lived token (60 days).

---

### Step 8: Test Token Immediately

After generating new token:

```bash
# Update .env.local with new token
# Then test:
node scripts/test-instagram-token.js
```

**Expected success response:**
```
✅ Token is valid!
   Account: @your_instagram_username
   Type: BUSINESS
   ID: 123456789
```

---

## Common Error Messages and Fixes

### "API access blocked"
**Cause:** Token invalid, expired, or permissions revoked
**Fix:** Generate fresh token with proper permissions

### "Invalid OAuth access token"
**Cause:** Token doesn't belong to your app
**Fix:** Generate token specifically for App ID 1187682906764579

### "Permissions error"
**Cause:** Missing required Instagram permissions
**Fix:** Request all Instagram permissions when generating token

### "This app is in development mode"
**Cause:** App not live, or account not a tester
**Fix:** Add your account as tester, or switch app to live (requires review)

### "Instagram account is not a business account"
**Cause:** Using personal Instagram account
**Fix:** Convert to Business/Creator account in Instagram settings

### "No Instagram Business Account found"
**Cause:** Instagram account not connected to Facebook Page
**Fix:** Link Instagram Business account to a Facebook Page

---

## Automated Debugging Script

Run this to check common issues:

```bash
# This will check:
# - App ID matches
# - Token format is correct
# - API endpoint accessibility
# - Basic connectivity
node scripts/test-instagram-token.js
```

---

## Manual Step-by-Step Verification

**I can guide you through checking each of these if you share:**

1. **Can you access the app dashboard?** (Yes/No)
   - URL: https://developers.facebook.com/apps/1187682906764579

2. **What app mode is it in?** (Development/Live)

3. **Is Instagram product visible in sidebar?** (Yes/No)

4. **What Instagram account is connected?** (@username)

5. **What's your role on the app?** (Admin/Developer/Tester/None)

6. **Can you generate a token in Graph API Explorer?** (Yes/No)

Provide answers to these and I can pinpoint the exact issue!

---

## Browser-Based Debugging (I Can Do This With You)

If you want, I can open the Facebook Developer dashboard with you using browser automation and we can check each setting together in real-time. Just let me know!
