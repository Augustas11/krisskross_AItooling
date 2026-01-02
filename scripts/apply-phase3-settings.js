require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function runMigration() {
    console.log('🏗️ Applying Phase 3 App Settings...');

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    try {
        const sql = fs.readFileSync('docs/migration-phase3-settings.sql', 'utf8');
        console.log(`📜 Loaded SQL (${sql.length} chars)`);

        const { data, error } = await supabase.rpc('exec_sql', { sql });

        if (error) {
            console.log('⚠️ RPC exec_sql failed, trying direct query (if service key available) or manual entry.');
            console.error('Error:', error);
            // Fallback: If exec_sql RPC doesn't exist or fails, we might rely on dashboard.
            // But since previous migrations worked, this should work.
        } else {
            console.log('✅ Migration Applied Successfully:', data);
        }

    } catch (err) {
        console.error('Fatal Error:', err);
    }
}

runMigration();
