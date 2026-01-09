const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCredentials() {
    console.log('🔍 Checking instagram_credentials table...');

    const { data, error } = await supabase
        .from('instagram_credentials')
        .select('*');

    if (error) {
        console.error('❌ Error:', error);
    } else {
        console.log('✅ Found credentials rows:', data.length);
        if (data.length > 0) {
            console.log('--- Credential 1 ---');
            console.log('ID:', data[0].id);
            console.log('App ID:', data[0].app_id);
            console.log('Instagram Username:', data[0].instagram_username);
            console.log('Token (first 10 chars):', data[0].access_token?.substring(0, 10));
            console.log('Updated At:', data[0].updated_at);
        } else {
            console.log('⚠️ No credentials found in table.');
        }
    }
}

checkCredentials();
