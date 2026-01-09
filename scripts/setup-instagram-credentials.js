const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
const appId = process.env.INSTAGRAM_APP_ID || process.env.FACEBOOK_APP_ID;

if (!supabaseUrl || !supabaseKey || !accessToken) {
    console.error('❌ Missing required environment variables (.env.local)');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupCredentials() {
    console.log('🔐 Setting up Instagram credentials from .env.local...');

    // 1. Get Instagram Account ID (needed for the table)
    // We'll try to fetch it from the API using the token
    console.log('📡 Fetching Instagram Account ID...');
    const meUrl = `https://graph.facebook.com/v21.0/me/accounts?access_token=${accessToken}`;

    try {
        const response = await fetch(meUrl);
        const data = await response.json();

        if (data.error) {
            console.error('❌ Error fetching account info:', data.error);
            // Fallback: try to insert without ID if we can't get it, or use a placeholder
            // But usually we need the page ID connected to Instagram
        } else {
            console.log('✅ Found Facebook Pages:', data.data?.length || 0);

            // Find page with connected Instagram account
            let instagramAccountId = null;
            let instagramUsername = null;

            for (const page of data.data || []) {
                const pageUrl = `https://graph.facebook.com/v21.0/${page.id}?fields=instagram_business_account&access_token=${accessToken}`;
                const pageRes = await fetch(pageUrl);
                const pageData = await pageRes.json();

                if (pageData.instagram_business_account) {
                    instagramAccountId = pageData.instagram_business_account.id;

                    // Get username
                    const igUrl = `https://graph.facebook.com/v21.0/${instagramAccountId}?fields=username&access_token=${accessToken}`;
                    const igRes = await fetch(igUrl);
                    const igData = await igRes.json();
                    instagramUsername = igData.username;

                    console.log(`✅ Found Instagram Account: @${instagramUsername} (${instagramAccountId})`);
                    break;
                }
            }

            if (instagramAccountId) {
                // 2. Insert/Update Credentials in Database
                const { error: upsertError } = await supabase
                    .from('instagram_credentials')
                    .upsert({
                        app_id: appId || 'unknown',
                        access_token: accessToken,
                        token_expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // Assume 60 days
                        instagram_account_id: instagramAccountId,
                        instagram_username: instagramUsername,
                        connection_status: 'connected',
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'instagram_account_id' });

                if (upsertError) {
                    console.error('❌ Failed to insert credentials:', upsertError);
                } else {
                    console.log('✅ Credentials successfully inserted into database!');

                    // 3. Trigger Sync Test
                    console.log('\n🧪 Triggering Instagram Sync...');
                    const { data: syncData, error: syncError } = await supabase.functions.invoke('instagram-sync');

                    if (syncError) {
                        console.error('❌ Sync call failed:', syncError);
                    } else {
                        console.log('✅ Sync response:', syncData);
                    }
                }
            } else {
                console.error('❌ Could not find a connected Instagram business account for this token.');
                console.log('Please ensure your Facebook Page is connected to an Instagram Business account.');
            }
        }
    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

setupCredentials();
