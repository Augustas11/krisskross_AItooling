/**
 * Test Instagram Sync Function
 * 
 * Manually triggers the instagram-sync Edge Function and displays results
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function testInstagramSync() {
    console.log('🧪 Testing Instagram Sync Function');
    console.log('==================================\n');

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.error('❌ Missing Supabase credentials in .env.local');
        process.exit(1);
    }

    try {
        console.log('📡 Calling instagram-sync Edge Function...');
        const response = await fetch(`${SUPABASE_URL}/functions/v1/instagram-sync`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('❌ Sync failed:', data.error);
            process.exit(1);
        }

        console.log('✅ Sync completed successfully!\n');
        console.log('📊 Results:');
        console.log(`   Sync ID: ${data.sync_id}`);
        console.log(`   Items Processed: ${data.stats.processed}`);
        console.log(`   Items Matched: ${data.stats.matched}`);
        console.log(`   Items Pending: ${data.stats.pending}`);
        console.log(`   Match Rate: ${((data.stats.matched / data.stats.processed) * 100).toFixed(1)}%\n`);

        // Fetch sync log details
        console.log('📋 Fetching sync log details...');
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        const { data: syncLog, error: logError } = await supabase
            .from('instagram_sync_log')
            .select('*')
            .eq('id', data.sync_id)
            .single();

        if (logError) {
            console.error('❌ Failed to fetch sync log:', logError.message);
        } else {
            console.log('   Status:', syncLog.status);
            console.log('   Started:', new Date(syncLog.started_at).toLocaleString());
            console.log('   Completed:', new Date(syncLog.completed_at).toLocaleString());
            console.log('   Duration:', Math.round((new Date(syncLog.completed_at) - new Date(syncLog.started_at)) / 1000), 'seconds');
        }

        console.log('\n✅ Test completed successfully!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

testInstagramSync();
