const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function repairExecSql() {
    console.log('🔧 Repairing exec_sql function...');

    // Revised function that handles both SELECT and UPDATE/INSERT
    const repairSQL = `
    CREATE OR REPLACE FUNCTION exec_sql(sql text)
    RETURNS json
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
        result json;
        first_word text;
    BEGIN
        first_word := lower(split_part(trim(sql), ' ', 1));
        
        IF first_word = 'select' OR first_word = 'with' THEN
            -- Wrap queries to return JSON
            EXECUTE 'SELECT json_agg(t) FROM (' || sql || ') t' INTO result;
            RETURN json_build_object('success', true, 'data', result);
        ELSE
            -- Direct execute for UPDATE, INSERT, CREATE, etc.
            EXECUTE sql;
            RETURN json_build_object('success', true, 'message', 'Command executed');
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
    END;
    $$;
  `;

    // We have to assume the current exec_sql is the "Bad Wrapper" version.
    // Running `CREATE OR REPLACE ...` via the "Bad Wrapper" (select from ...) might fail?
    // "SELECT ... FROM (CREATE OR REPLACE ...) t" -> Syntax Error? CREATE returns no rows.
    // If it's a syntax error, we are Locked Out!

    // If we are locked out, we must ask the user to fix it manually.

    // Let's try.

    // Actually, if the previous logic was:
    // EXECUTE 'SELECT json_agg(t) FROM (' || sql || ') t' INTO result;

    // And we pass `CREATE OR REPLACE...`
    // `SELECT json_agg(t) FROM (CREATE OR REPLACE...) t`
    // Valid Postgres? No. Subquery must be SELECT/VALUES.

    // CRITICAL: I might have broken my only access.

    // Wait, does `docs/supabase-exec-sql-function.sql` still exist?
    // I can ask the user to run it again.

    // Trying to run the fix via the broken function:
    const { data, error } = await supabase.rpc('exec_sql', { sql: repairSQL });

    // Check results
    if (error || (data && !data.success)) {
        console.error('❌ Failed to repair via RPC:', error || data?.error);
        console.log('⚠️  CRITICAL: Access broken. Asking user to reset exec_sql.');
    } else {
        console.log('✅ exec_sql repaired successfully!');

        // Verify
        const { data: q } = await supabase.rpc('exec_sql', { sql: "SELECT count(*) FROM leads" });
        console.log('Test Query:', JSON.stringify(q));

        const { data: u } = await supabase.rpc('exec_sql', { sql: "UPDATE leads SET enrichment_version=1 WHERE 1=0" });
        console.log('Test Update:', JSON.stringify(u));
    }
}

repairExecSql();
