#!/bin/bash

# Instagram Token Generation Helper
# This script guides you through generating a new Instagram access token

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📱 Instagram Access Token Generation Guide"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎯 STEP 1: Determine Which App to Use"
echo ""
echo "You have TWO Facebook Apps:"
echo "  Option A: KrissKross.ai (749654080971157)"
echo "  Option B: KrissKross Leads CRM (1187682906764579)"
echo ""
echo "📋 To check which one has Instagram configured:"
echo "  1. Open: https://developers.facebook.com/apps/"
echo "  2. Click on each app"
echo "  3. Look for 'Instagram' in the Products section"
echo ""
read -p "Which app has Instagram? (A or B): " app_choice

if [ "$app_choice" = "A" ] || [ "$app_choice" = "a" ]; then
    APP_ID="749654080971157"
    APP_NAME="KrissKross.ai"
elif [ "$app_choice" = "B" ] || [ "$app_choice" = "b" ]; then
    APP_ID="1187682906764579"
    APP_NAME="KrissKross Leads CRM"
else
    echo "❌ Invalid choice. Please run the script again and choose A or B."
    exit 1
fi

echo ""
echo "🔑 Enter App Secret for $APP_NAME:"
read -s APP_SECRET
echo ""
if [ -z "$APP_SECRET" ]; then
    echo "❌ App Secret is required."
    exit 1
fi

echo ""
echo "✅ Selected: $APP_NAME (App ID: $APP_ID)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 STEP 2: Generate Short-Lived Token"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Instructions:"
echo "  1. Open: https://developers.facebook.com/tools/explorer"
echo "  2. Select App: $APP_NAME"
echo "  3. Click 'Generate Access Token'"
echo "  4. Select these permissions:"
echo "     ✓ instagram_basic"
echo "     ✓ instagram_manage_messages"
echo "     ✓ instagram_manage_comments"
echo "     ✓ pages_manage_metadata"
echo "     ✓ pages_read_engagement"
echo "     ✓ pages_show_list"
echo "  5. Click 'Generate Access Token' and authorize"
echo "  6. Copy the token"
echo ""
read -p "Paste the short-lived token here: " SHORT_TOKEN

if [ -z "$SHORT_TOKEN" ]; then
    echo "❌ No token provided. Exiting."
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔄 STEP 3: Exchanging for Long-Lived Token..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Exchange for long-lived token
EXCHANGE_URL="https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=$APP_ID&client_secret=$APP_SECRET&fb_exchange_token=$SHORT_TOKEN"

RESPONSE=$(curl -s "$EXCHANGE_URL")

# Check if response contains error
if echo "$RESPONSE" | grep -q "error"; then
    echo "❌ Error exchanging token:"
    echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
    exit 1
fi

# Extract long-lived token
LONG_TOKEN=$(echo "$RESPONSE" | jq -r '.access_token' 2>/dev/null)

if [ -z "$LONG_TOKEN" ] || [ "$LONG_TOKEN" = "null" ]; then
    echo "❌ Failed to extract token from response:"
    echo "$RESPONSE"
    exit 1
fi

echo "✅ Successfully generated long-lived token!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 STEP 4: Update Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Add these to your .env.local file:"
echo ""
echo "INSTAGRAM_APP_ID=$APP_ID"
echo "INSTAGRAM_APP_SECRET=$APP_SECRET"
echo "INSTAGRAM_ACCESS_TOKEN=$LONG_TOKEN"
echo ""

# Update .env.local if it exists
if [ -f ".env.local" ]; then
    echo "🔧 Updating .env.local..."
    
    # Backup existing file
    cp .env.local .env.local.backup
    
    # Remove old Instagram variables
    sed -i.tmp '/^INSTAGRAM_APP_ID=/d' .env.local
    sed -i.tmp '/^INSTAGRAM_APP_SECRET=/d' .env.local
    sed -i.tmp '/^INSTAGRAM_ACCESS_TOKEN=/d' .env.local
    rm .env.local.tmp
    
    # Add new variables
    echo "" >> .env.local
    echo "# Instagram API Configuration (Updated $(date))" >> .env.local
    echo "INSTAGRAM_APP_ID=$APP_ID" >> .env.local
    echo "INSTAGRAM_APP_SECRET=$APP_SECRET" >> .env.local
    echo "INSTAGRAM_ACCESS_TOKEN=$LONG_TOKEN" >> .env.local
    
    echo "✅ .env.local updated! (Backup saved as .env.local.backup)"
else
    echo "⚠️  .env.local not found. Please create it manually with the values above."
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 STEP 5: Test the Token"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Run these commands to verify:"
echo ""
echo "  node scripts/test-user-token.js"
echo "  node scripts/debug-instagram-data.js"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 STEP 6: Update Vercel (Production)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Don't forget to update Vercel environment variables:"
echo "  1. Go to: https://vercel.com/dashboard"
echo "  2. Select your project"
echo "  3. Settings → Environment Variables"
echo "  4. Update the three INSTAGRAM_* variables"
echo "  5. Redeploy"
echo ""
echo "✅ Done!"
