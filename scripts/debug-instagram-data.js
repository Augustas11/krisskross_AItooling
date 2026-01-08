/**
 * Debug Instagram Data
 * 
 * 1. Checks DB counts
 * 2. Tries to fetch conversations from Instagram API directly
 * 3. Tries to run the sync logic manually
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function debug() {
    console.log('🔍 Debugging Instagram Data...\n');

    // 1. Check Database
    const { count: convoCount, error: convoError } = await supabase.from('instagram_conversations').select('*', { count: 'exact', head: true });
    const { count: msgCount, error: msgError } = await supabase.from('instagram_messages').select('*', { count: 'exact', head: true });

    if (convoError) console.error('Database Error (Conversations):', convoError.message);
    if (msgError) console.error('Database Error (Messages):', msgError.message);

    console.log('📊 Database State:');
    console.log(`- Conversations: ${convoCount || 0}`);
    console.log(`- Messages: ${msgCount || 0}`);

    // 2. Test API Fetch (Conversations)
    const token = process.env.INSTAGRAM_ACCESS_TOKEN;
    console.log(`\n🔑 Testing API with Token prefix: ${token?.substring(0, 10)}...`);

    if (!token) {
        console.error('❌ INSTAGRAM_ACCESS_TOKEN is missing in environment!');
        return;
    }

    try {
        // Step A: Get Instagram Business Account ID
        const meUrl = `https://graph.facebook.com/v21.0/me?fields=accounts{instagram_business_account}&access_token=${token}`;
        const meRes = await fetch(meUrl).then(r => r.json());

        if (meRes.error) {
            console.error('❌ API Error (Get Account):', meRes.error.message);
            return;
        }

        const page = meRes.accounts?.data?.[0];
        const instagramId = page?.instagram_business_account?.id;

        if (!instagramId) {
            console.error('❌ No Linked Instagram Account found in API response!');
            console.log('Full Response:', JSON.stringify(meRes, null, 2));
            return;
        }

        console.log(`✅ Found Instagram ID: ${instagramId}`);

        // Step B: Fetch Conversations
        const convUrl = `https://graph.facebook.com/v21.0/${instagramId}/conversations?fields=id,updated_time,participants&access_token=${token}`;
        const convRes = await fetch(convUrl).then(r => r.json());

        if (convRes.error) {
            console.error('❌ API Error (Fetch Conversations):', convRes.error.message);
        } else {
            console.log(`✅ API Success! Found ${convRes.data?.length || 0} conversations on Instagram.`);
            if (convRes.data?.length > 0) {
                console.log('Sample:', JSON.stringify(convRes.data[0], null, 2));
            } else {
                console.log('⚠️ Your Instagram account has 0 conversations on the Platform.');
            }
        }

    } catch (e) {
        console.error('Script Error:', e);
    }
}

debug();
