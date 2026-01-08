# Instagram Token Generation - Step-by-Step Guide

The token keeps failing because the **Page selection isn't being saved** during generation. Here's the exact process:

## ✅ Correct Token Generation Steps

### 1. Go to Graph API Explorer
Visit: https://developers.facebook.com/tools/explorer/

###  2. Configure App Settings
- **Select your App**: `KrissKross Leads CRM` (App ID: 1187682906764579)
- **User or Page**: Select "User Token" (NOT Page Token)

### 3. Generate Token with Page Access
1. Click **"Generate Access Token"**
2. Facebook Login popup will appear
3. **CRITICAL SCREEN**: You'll see "Choose what you allow"
   - Look for section: **"Which Pages do you want connected?"**
   - **CHECK THE BOX** next to "KrissKross AI"
   - Click **"Continue"** or **"Done"**

### 4. Verify Token Shows Page
Before copying the token:
1. In Graph Explorer, paste this in the query field: `/me/accounts`
2. Click **Submit**
3. You should see: `{ "data": [ { "id": "...", "name": "KrissKross AI" } ] }`
4. If you see `"data": []`, the Page wasn't selected. Go back to step 3.

### 5. Copy Token
Once `/me/accounts` shows your Page, copy the Access Token.

## 🚫 Common Mistakes
- Selecting "Page Token" instead of "User Token"
- Not checking the "KrissKross AI" box in the permission popup
- Copying token before verifying `/me/accounts` works

## ⚠️ If Still Failing
The alternative is to generate a **Page Access Token** directly:
1. In Graph Explorer dropdown: "Get Page Access Token"
2. Select "KrissKross AI" 
3. This gives you a Page-specific token (different type but might work)
