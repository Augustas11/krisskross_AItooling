import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Parse SQL into individual statements
 */
function parseSqlStatements(sql) {
    // Remove comments
    const withoutComments = sql.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');

    // Split by semicolon, but be smart about it (don't split inside strings or functions)
    const statements = [];
    let current = '';
    let inString = false;
    let stringChar = '';

    for (let i = 0; i < withoutComments.length; i++) {
        const char = withoutComments[i];
        const prevChar = withoutComments[i - 1];

        if ((char === "'" || char === '"') && prevChar !== '\\') {
            if (!inString) {
                inString = true;
                stringChar = char;
            } else if (char === stringChar) {
                inString = false;
            }
        }

        if (char === ';' && !inString) {
            if (current.trim()) {
                statements.push(current.trim());
            }
            current = '';
        } else {
            current += char;
        }
    }

    if (current.trim()) {
        statements.push(current.trim());
    }

    return statements.filter(s => s.length > 0);
}

/**
 * Execute SQL statement using Supabase client
 */
async function executeStatement(statement) {
    // Use the sql template tag for raw SQL execution
    const { data, error } = await supabase.rpc('exec_sql', { sql: statement });

    if (error) {
        throw error;
    }

    return data;
}

/**
 * Run migration with detailed progress
 */
async function runMigration(migrationPath) {
    const fullPath = path.join(process.cwd(), migrationPath);

    if (!fs.existsSync(fullPath)) {
        console.error(`❌ Migration file not found: ${fullPath}`);
        process.exit(1);
    }

    console.log(`\n📄 Reading migration: ${migrationPath}`);
    const sqlContent = fs.readFileSync(fullPath, 'utf8');

    const statements = parseSqlStatements(sqlContent);
    console.log(`📊 Found ${statements.length} SQL statements to execute\n`);

    console.log(`🔄 Executing migration...`);
    console.log(`─────────────────────────────────────────────────────\n`);

    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        const preview = statement.substring(0, 80).replace(/\s+/g, ' ');

        try {
            console.log(`[${i + 1}/${statements.length}] ${preview}${statement.length > 80 ? '...' : ''}`);
            await executeStatement(statement);
            successCount++;
        } catch (error) {
            console.error(`   ❌ Error: ${error.message}`);
            failedCount++;

            // If exec_sql function doesn't exist, show manual instructions
            if (error.code === '42883' || error.message.includes('function')) {
                console.log(`\n⚠️  The exec_sql function is not installed in your Supabase database.`);
                console.log(`\n📋 Please run this migration manually:\n`);
                showManualInstructions(migrationPath, sqlContent);
                process.exit(1);
            }
        }
    }

    console.log(`\n─────────────────────────────────────────────────────`);
    if (failedCount === 0) {
        console.log(`✅ Migration completed successfully!`);
        console.log(`   ${successCount} statements executed\n`);
    } else {
        console.log(`⚠️  Migration completed with errors`);
        console.log(`   ✅ ${successCount} succeeded`);
        console.log(`   ❌ ${failedCount} failed\n`);
        process.exit(1);
    }
}

/**
 * Show manual migration instructions
 */
function showManualInstructions(migrationPath, sqlContent) {
    console.log(`Steps:`);
    console.log(`1. Go to: https://supabase.com/dashboard/project/_/sql`);
    console.log(`2. Copy the SQL content below`);
    console.log(`3. Paste into SQL Editor and click "Run"\n`);
    console.log(`─────────────────────────────────────────────────────`);
    console.log(`SQL Content:\n`);
    console.log(sqlContent);
    console.log(`─────────────────────────────────────────────────────\n`);
}

// Main execution
const migrationFile = process.argv[2];

if (!migrationFile) {
    console.log('\n📚 Supabase Migration Runner\n');
    console.log('Usage: node scripts/run-migration.js <path-to-migration.sql>\n');
    console.log('Example: node scripts/run-migration.js docs/migration-email-sequences.sql\n');
    console.log('Note: Requires exec_sql function to be installed in Supabase.');
    console.log('      Run docs/supabase-exec-sql-function.sql first if not installed.\n');
    process.exit(1);
}

runMigration(migrationFile);
