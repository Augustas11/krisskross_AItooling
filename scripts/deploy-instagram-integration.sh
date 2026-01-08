#!/bin/bash

# Instagram Integration Deployment Script
# Deploys database migration and Edge Function to Supabase

set -e  # Exit on error

echo "🚀 Instagram Integration Deployment"
echo "===================================="
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Check if logged in to Supabase
echo "📋 Checking Supabase connection..."
if ! supabase projects list &> /dev/null; then
    echo "❌ Not logged in to Supabase. Please run:"
    echo "   supabase login"
    exit 1
fi

echo "✅ Supabase CLI ready"
echo ""

# Step 1: Deploy database migration
echo "📊 Step 1: Deploying database migration..."
echo "   File: supabase/migrations/20260108_instagram_enhancements.sql"

# Link to project if not already linked
if [ ! -f ".supabase/config.toml" ]; then
    echo "🔗 Linking to Supabase project..."
    supabase link --project-ref $(supabase projects list --output json | jq -r '.[0].id')
fi

# Run migration
supabase db push

echo "✅ Database migration deployed"
echo ""

# Step 2: Deploy Edge Function
echo "⚡ Step 2: Deploying instagram-sync Edge Function..."
echo "   File: supabase/functions/instagram-sync/index.ts"

supabase functions deploy instagram-sync --no-verify-jwt

echo "✅ Edge Function deployed"
echo ""

# Step 3: Verify deployment
echo "🔍 Step 3: Verifying deployment..."

# Check if tables exist
echo "   Checking instagram_sync_log table..."
supabase db execute "SELECT COUNT(*) FROM instagram_sync_log;" > /dev/null 2>&1 && echo "   ✅ instagram_sync_log table exists" || echo "   ❌ instagram_sync_log table not found"

# Check if columns exist
echo "   Checking instagram_interactions.direction column..."
supabase db execute "SELECT direction FROM instagram_interactions LIMIT 1;" > /dev/null 2>&1 && echo "   ✅ direction column exists" || echo "   ❌ direction column not found"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next Steps:"
echo "   1. Test the sync function manually:"
echo "      npm run test:instagram-sync"
echo ""
echo "   2. Set up pg_cron for automated sync (15-minute intervals):"
echo "      Run the SQL in supabase/migrations/trigger_setup.sql"
echo ""
echo "   3. Monitor sync logs:"
echo "      SELECT * FROM instagram_sync_log ORDER BY started_at DESC LIMIT 10;"
echo ""
