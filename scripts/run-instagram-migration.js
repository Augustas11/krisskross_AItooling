/**
 * Run Instagram Integration Database Migration
 * This script executes the SQL migration to create Instagram tables
 */

const fs = require('fs');
const path = require('path');

// Read environment variables
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Supabase credentials not found in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runMigration() {
    try {
        console.log('📦 Reading migration SQL file...');
        const sqlPath = path.join(__dirname, '../docs/20250104_instagram_integration.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('🚀 Running migration...');
        console.log('⚠️  Note: This may take a few moments...');

        // Execute the SQL
        const { data, error } = await supabase.rpc('exec_sql', { query: sql });

        if (error) {
            // If exec_sql function doesn't exist, we need to create it first
            if (error.message && error.message.includes('function') && error.message.includes('does not exist')) {
                console.log('\n⚠️  The exec_sql function doesn\'t exist in your database.');
                console.log('You need to run this migration manually in Supabase SQL Editor:');
                console.log('\n1. Go to: https://supabase.com/dashboard/project/qaeljtxrsujaqnmayhct/sql');
                console.log('2. Copy the content from: docs/20250104_instagram_integration.sql');
                console.log('3. Paste and click "Run"');
                console.log('\nOr run this setup SQL first to create exec_sql function:');
                console.log('See: docs/supabase-exec-sql-function.sql\n');
                process.exit(1);
            }

            throw error;
        }

        console.log('✅ Migration completed successfully!');
        console.log('\nCreated tables:');
        console.log('  - instagram_credentials');
        console.log('  - instagram_interactions');
        console.log('  - instagram_conversations');
        console.log('  - instagram_messages');
        console.log('  - instagram_pending_matches');
        console.log('  - Added instagram_handle to leads table');
        console.log('\n🎉 You can now test the Instagram connection at:');
        console.log('   http://localhost:3001/admin/instagram-connection\n');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error('\nPlease run the migration manually in Supabase SQL Editor:');
        console.error('1. Open: https://supabase.com/dashboard/project/qaeljtxrsujaqnmayhct/sql');
        console.error('2. Copy content from: docs/20250104_instagram_integration.sql');
        console.error('3. Paste and execute\n');
        process.exit(1);
    }
}

runMigration();
