const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function applyMigrations() {
    console.log('🚀 Applying Supabase Migrations (Robust Mode)...');

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
            // Use the repaired exec_sql
            const { data, error } = await supabase.rpc('exec_sql', { sql });

            if (error) {
                // RPC Failure (Network/Auth)
                console.error(`❌ RPC Error executing ${file}:`, error.message);
            } else {
                // RPC Success, check inner logic
                if (data && data.success) {
                    console.log(`✅ Success: ${data.message || 'Migration applied'}`);
                } else {
                    console.error(`❌ SQL Error executing ${file}:`, data?.error || 'Unknown error');
                    // If error is "relation already exists" or "column already exists", that's fine.
                    const err = data?.error || '';
                    if (err.includes('already exists')) {
                        console.log('⚠️  (Notice: Object already exists, continuing...)');
                    } else {
                        // If critical error, stop?
                        // For now, let's try to continue but log heavily.
                    }
                }
            }
        } catch (err) {
            console.error(`❌ Unexpected error:`, err.message);
        }
    }
}

applyMigrations();
