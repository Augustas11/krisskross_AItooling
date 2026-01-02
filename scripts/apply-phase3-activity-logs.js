import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function runMigration() {
    console.log('🔄 Applying Phase 3 (Activity Logs) Migration...');

    const sqlPath = path.join(__dirname, '../docs/migration-phase3-activity-logs.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

    for (const statement of statements) {
        if (statement.startsWith('--')) continue;

        console.log(`Executing: ${statement.substring(0, 50)}...`);
        const { error } = await supabase.rpc('exec_sql', { sql: statement });

        if (error) {
            console.error('❌ SQL Error:', error);
            // If RPC is missing, we might need a different strategy, but assuming it works based on history
        } else {
            console.log('✅ Success');
        }
    }
}

runMigration();
