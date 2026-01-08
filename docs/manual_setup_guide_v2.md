# Instagram API Setup Guide (Definitive Version)

This guide walks you through the comprehensive setup of the Instagram API integration, ensuring you have the correct tokens and permissions.

## Phase 1: Meta Developer Console

### 1. Identify the Correct App
You have two apps. We must identify which one has the "Instagram Graph API" product enabled.

1.  Go to [Meta App Dashboard](https://developers.facebook.com/apps/)
2.  Check both apps (`KrissKross.ai` and `KrissKross Leads CRM`).
3.  **Click on each app** and look at the left sidebar or the "Products" section.
4.  **Find the one that has "Instagram Graph API" added.**
    *   *Note: If neither has it, add "Instagram Graph API" to the one you want to use (likely `KrissKross.ai`).*
5.  **Record the App ID and App Secret** for this correct app.

### 2. Verify Your Facebook Page Connection
1.  Go to your [Facebook Page Settings](https://www.facebook.com/)
2.  Navigate to **Linked Accounts** → **Instagram**.
3.  Ensure your **Instagram Business Account** is connected here.
    *   *If not, connect it now. This is mandatory.*

---

## Phase 2: Token Generation

We will generate a **Facebook User Access Token** (not an Instagram token).

1.  Go to [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2.  **Meta App**: Select the correct App from Phase 1.
3.  **User or Page**: Select "User Token".
4.  **Permissions**: Add the following permissions (search and select them):
    *   `instagram_basic`
    *   `instagram_manage_messages`
    *   `instagram_manage_comments`
    *   `pages_manage_metadata`
    *   `pages_read_engagement`
    *   `pages_show_list`
    *   `pages_messaging` (Search for this specifically)
    *   `business_management` (Optional but recommended)
5.  Click **Generate Access Token**.
6.  A popup will appear asking for approval. **Approve as yourself**.
    *   *Important: Select the Facebook Page linked to your Instagram account.*
7.  **Copy the Access Token** generated in the top field.
    *   *It should start with `EAAQ...`*

---

## Phase 3: Exchange for Long-Lived Token (Crucial)

The token you just got expires in 1 hour. We need to exchange it for a 60-day token.

1.  In the Graph API Explorer (or your terminal), run this command (replace placeholders):

```bash
curl -i -X GET "https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id={YOUR_APP_ID}&client_secret={YOUR_APP_SECRET}&fb_exchange_token={SHORT_LIVED_TOKEN}"
```

2.  **Copy the "access_token"** from the JSON response. This is your **Long-Lived Token**.

---

## Phase 4: Project Configuration

### 1. Update Environment Variables
Open your `.env.local` file and update the following values with what you gathered above:

```env
# Facebook App Configuration
FACEBOOK_APP_ID=749654080971157  # Replace with the CORRECT App ID from Phase 1
FACEBOOK_APP_SECRET=...          # Replace with the CORRECT App Secret

# Token Encryption Key (I generated this for you)
TOKEN_ENCRYPTION_KEY=4739d19f87549b560a09a053727b42ff5144b986da2e5f610f34207d587d811a

# Webhook Configuration (we will set this up later)
INSTAGRAM_WEBHOOK_VERIFY_TOKEN=krisskross_instagram_webhook_2026

# DEPRECATED - Do not use these anymore
# INSTAGRAM_ACCESS_TOKEN=...
```

### 2. Verify Connection
Run the verification script (I will provide/update this script for you next).

```bash
node scripts/verify-token-manager.js
```
