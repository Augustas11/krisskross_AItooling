/**
 * Quick database check script to verify instagram_credentials state
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDatabase() {
    console.log('🔍 Checking instagram_credentials table...\n');

    const { data, error } = await supabase
        .from('instagram_credentials')
        .select('*')
        .eq('id', '550e8400-e29b-41d4-a716-446655440000')
        .single();

    if (error) {
        console.error('❌ Database error:', error.message);
        return;
    }

    if (!data) {
        console.error('❌ No record found');
        return;
    }

    console.log('✅ Record found:');
    console.log('   ID:', data.id);
    console.log('   App ID:', data.app_id);
    console.log('   Instagram Username:', data.instagram_username || 'NULL');
    console.log('   Instagram Account ID:', data.instagram_account_id || 'NULL');
    console.log('   Connection Status:', data.connection_status);
    console.log('   Token Expires:', data.token_expires_at);
    console.log('   Last Sync:', data.last_sync_at || 'NULL');
    console.log('   Created:', data.created_at);
    console.log('   Updated:', data.updated_at);
}

checkDatabase();
