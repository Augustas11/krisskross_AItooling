const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyIntegration() {
    console.log('🧪 Verifying Instagram Integration (Phase 1 & 2)...');
    console.log('===================================================');

    // 1. Trigger Sync Function
    console.log('\n📡 1. Triggering Sync Edge Function...');
    const start = Date.now();
    const { data: syncData, error: syncError } = await supabase.functions.invoke('instagram-sync');

    if (syncError) {
        console.error('❌ Sync Function Failed:', syncError);
        // We continue to check logs just in case
    } else {
        console.log('✅ Sync Function Returned Success:', syncData);
    }
    const duration = Date.now() - start;
    console.log(`   (Took ${duration}ms)`);

    // 1.5 Debug Token Scopes
    console.log('\n🔍 1.5 Checking Token Permissions...');
    try {
        const token = process.env.INSTAGRAM_ACCESS_TOKEN;
        const appId = process.env.FACEBOOK_APP_ID || process.env.INSTAGRAM_APP_ID;
        if (token && appId) {
            const debugUrl = `https://graph.facebook.com/debug_token?input_token=${token}&access_token=${token}`;
            const res = await fetch(debugUrl);
            const data = await res.json();
            if (data.data) {
                console.log('   ✅ Token is Valid');
                console.log('   Scopes:', data.data.scopes);

                const required = ['instagram_basic', 'instagram_manage_messages', 'instagram_manage_comments', 'pages_show_list', 'pages_read_engagement'];
                const missing = required.filter(r => !data.data.scopes.includes(r));

                if (missing.length > 0) {
                    console.error('   ❌ MISSING PERMISSIONS:', missing.join(', '));
                    console.error('   ⚠️ This explains the (#3) error! Please regenerate token with these permissions.');
                } else {
                    console.log('   ✅ All required permissions present.');
                }
            } else {
                console.log('   ⚠️ Could not debug token:', data);
            }
        }
    } catch (e) {
        console.log('   ⚠️ Token check failed:', e.message);
    }

    // 2. Check Sync Log
    console.log('\n2. Checking Sync Logs...');
    const { data: logs, error: logError } = await supabase
        .from('instagram_sync_log')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(1);

    if (logError) {
        console.error('❌ Failed to fetch logs:', logError);
    } else if (logs.length === 0) {
        console.error('❌ No sync logs found!');
    } else {
        const log = logs[0];
        console.log(`   Last Run Status: ${log.status.toUpperCase()}`);
        console.log(`   Processed: ${log.items_processed}`);
        console.log(`   Matched: ${log.items_matched}`);
        console.log(`   Pending: ${log.items_pending}`);
        console.log(`   Detailed Status:`, log.error_message || 'No errors');

        if (log.status !== 'completed') {
            console.warn('⚠️ Sync did not complete successfully in the logs.');
        } else {
            console.log('✅ Sync log confirms completion.');
        }
    }

    // 3. Check Data Population
    console.log('\n3. Verifying Database Content...');

    // Credentials
    const { count: credCount } = await supabase.from('instagram_credentials').select('*', { count: 'exact' });
    console.log(`   Credentials: ${credCount} (Expected: >= 1)`);

    // Conversations
    const { data: convs, count: convCount } = await supabase.from('instagram_conversations').select('*', { count: 'exact' }).limit(3);
    console.log(`   Conversations: ${convCount}`);
    if (convs && convs.length > 0) {
        console.log('   🔍 Sample Conversation Check (Phase 2 Enhancements):');
        const c = convs[0];
        console.log(`      - ID: ${c.id}`);
        console.log(`      - Unread Count: ${c.unread_count}`);
        console.log(`      - Last Message: "${c.last_message_preview}"`);
        console.log(`      - Status: ${c.status}`);
    }

    // Messages
    const { count: msgCount } = await supabase.from('instagram_messages').select('*', { count: 'exact' });
    console.log(`   Messages: ${msgCount}`);

    // Interactions
    const { count: intCount } = await supabase.from('instagram_interactions').select('*', { count: 'exact' });
    console.log(`   Interactions: ${intCount}`);

    // Pending Matches
    const { count: pendingCount } = await supabase.from('instagram_pending_matches').select('*', { count: 'exact' });
    console.log(`   Pending Matches: ${pendingCount}`);

    console.log('\n===================================================');
    if (convCount > 0 || msgCount > 0 || pendingCount > 0) {
        console.log('✅ VERIFICATION PASSED: Data is flowing!');
    } else {
        console.warn('⚠️ VERIFICATION INCONCLUSIVE: No data synced yet. (Is the account active?)');
    }
}

verifyIntegration();
