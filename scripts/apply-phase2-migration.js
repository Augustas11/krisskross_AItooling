require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function runMigration() {
    console.log('🏗️ Applying Phase 2 Migration (Trial Sequence)...');

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    try {
        const sql = fs.readFileSync('docs/migration-phase2-trial-sequence.sql', 'utf8');
        console.log(`📜 Loaded SQL (${sql.length} chars)`);

        const { data, error } = await supabase.rpc('exec_sql', { sql });

        if (error) {
            console.error('❌ Migration Failed:', error);
        } else {
            console.log('✅ Migration Applied Successfully:', data);
        }

    } catch (err) {
        console.error('Fatal Error:', err);
    }
}

runMigration();
