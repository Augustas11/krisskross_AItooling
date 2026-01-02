const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function reloadSchema() {
    console.log('🔄 Reloading Supabase Schema Cache...');

    const { error } = await supabase.rpc('exec_sql', {
        sql: "NOTIFY pgrst, 'reload schema';"
    });

    if (error) {
        console.error('❌ Error reloading schema:', error.message);
    } else {
        console.log('✅ Schema Cache Reloaded. Waiting 3 seconds...');
        await new Promise(r => setTimeout(r, 3000));
    }
}

reloadSchema();
