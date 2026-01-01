
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function listBackups() {
    console.log('🔍 Checking leads_backups table...');

    // Check if table exists/has data
    const { data, error } = await supabase
        .from('leads_backups')
        .select('id, created_at, lead_count, source')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('❌ Error fetching backups:', error);
        return;
    }

    console.log(`found ${data.length} backups:`);
    console.table(data);
}

listBackups();
