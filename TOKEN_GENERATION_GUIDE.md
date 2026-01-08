# Generate Instagram Access Token - Step by Step

## App Details
- **App ID:** 1187682906764579
- **App Name:** KrissKross Leads CRM
- **App Secret:** [REDACTED]

---

## Step 1: Generate Short-Lived Token

### Instructions:

1. **Open Graph API Explorer:**
   - Go to: https://developers.facebook.com/tools/explorer

2. **Select Your App:**
   - In the top dropdown, select: **KrissKross Leads CRM** (1187682906764579)

3. **Generate Token:**
   - Click the "Generate Access Token" button

4. **Select Permissions:**
   When prompted, select ALL of these permissions:
   - ✅ `instagram_basic`
   - ✅ `instagram_manage_messages`
   - ✅ `instagram_manage_comments`
   - ✅ `pages_manage_metadata`
   - ✅ `pages_read_engagement`
   - ✅ `pages_show_list`

5. **Authorize:**
   - Click "Continue" and authorize the app
   - Make sure to select the Facebook Page that's linked to your Instagram account

6. **Copy Token:**
   - Copy the token that appears in the "Access Token" field
   - It should start with "EAAQ..." or similar

---

## Step 2: Provide the Token

Once you have the short-lived token, paste it here and I'll:
1. Exchange it for a long-lived token (60-day validity)
2. Update your `.env.local` file
3. Run verification tests
4. Guide you through updating Vercel

---

## Important Notes

⚠️ **The short-lived token expires in 1 hour**, so complete this process soon after generating it.

✅ **Make sure your Instagram Business Account is linked to a Facebook Page** that you have admin access to.

🔐 **Never share tokens publicly** - only provide them to me in this secure chat.

---

## Troubleshooting

### "No Instagram account found"
- Ensure your Instagram account is set to Business or Creator
- Link it to a Facebook Page in Instagram settings
- Make sure the Page is accessible with your Facebook account

### "Permission denied"
- Make sure you're an admin of the Facebook Page
- Verify the Page has the Instagram account linked
- Try logging out and back into Facebook

### "App not found"
- Verify you have access to App 1187682906764579
- Check you're logged into the correct Facebook account
- Go to https://developers.facebook.com/apps/ to see your apps

---

**Ready?** Generate the token and paste it here!
