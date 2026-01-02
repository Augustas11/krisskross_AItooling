const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function applyMigrations() {
    console.log('🚀 Applying Supabase Migrations...');

    const migrations = [
        'docs/migration-enrichment-status.sql',
        'docs/migration-enrichment-queue.sql'
    ];

    for (const file of migrations) {
        const filePath = path.join(process.cwd(), file);
        if (!fs.existsSync(filePath)) {
            console.error(`❌ Migration file not found: ${file}`);
            continue;
        }

        const sql = fs.readFileSync(filePath, 'utf8');
        console.log(`\n📄 Executing ${file}...`);

        try {
            const { data, error } = await supabase.rpc('exec_sql', { sql });

            if (error) {
                console.error(`❌ Error executing ${file}:`, error.message);
                // Special handle: If exec_sql missing, warn user
                if (error.code === 'PGRST202' || error.message.includes('function exec_sql') || error.message.includes('not found')) {
                    console.error('\n⚠️  CRITICAL: The function "exec_sql" is missing from your Supabase instance.');
                    console.error('Please run the SQL in "docs/supabase-exec-sql-function.sql" manually in your Supabase SQL Editor first!');
                    process.exit(1);
                }
            } else {
                console.log(`✅ Success: ${data?.message || 'Migration applied'}`);
            }
        } catch (err) {
            console.error(`❌ Unexpected error:`, err.message);
        }
    }
}

applyMigrations();
