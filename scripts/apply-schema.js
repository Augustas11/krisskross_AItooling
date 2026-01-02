const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applySchema() {
    const schemaPath = path.join(__dirname, '../supabase/auth_schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('🔄 Attempting to apply schema via exec_sql RPC...');

    const { data, error } = await supabase.rpc('exec_sql', { sql: schema });

    if (error) {
        console.error('❌ Failed to apply schema via RPC:', error.message);
        console.error('   This likely means the exec_sql function is not installed in your Supabase project.');
        console.error('   Please run the contents of docs/supabase-exec-sql-function.sql in your Supabase SQL Editor manually.');
        process.exit(1);
    }

    console.log('✅ Schema applied successfully!');
    console.log(data);
}

applySchema();
