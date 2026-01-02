const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function upgradeExecSql() {
    console.log('🆙 Upgrading exec_sql function to return results...');

    // New function definition that wraps query in json_agg to return data
    // Note: We handle both SELECT (returns rows) and others (update/insert void)
    // But json_agg on specific statements might fail?
    // Actually, standardizing on returning a result object is safer.

    // Revised Strategy:
    // If we want to capture output, we can use a different function or intelligent logic.
    // But simpler is to assume input is a query we want data from, OR use a generic pattern.
    // Pattern: EXECUTE 'SELECT json_agg(t) FROM (' || sql || ') t' INTO result;

    const upgradeSQL = `
    CREATE OR REPLACE FUNCTION exec_sql(sql text)
    RETURNS json
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
        result json;
    BEGIN
        -- Attempt to execute as a query returning JSON
        -- We wrap the input SQL in a subquery to convert rows to JSON
        EXECUTE 'SELECT json_agg(t) FROM (' || sql || ') t' INTO result;
        
        -- If result is null (e.g. invalid SQL or no rows), it returns null or error
        RETURN json_build_object('success', true, 'data', result, 'message', 'Executed as query');
    EXCEPTION WHEN OTHERS THEN
        -- Fallback: Maybe it wasn't a SELECT? 
        -- But 'CREATE TABLE' via json_agg might fail?
        -- Actually, CREATE TABLE returns no rows. json_agg on 0 rows returns null.
        -- So it should be fine.
        -- But if it's a syntax error, we catch it.
        
        -- Let's check error code. If it helps.
        RETURN json_build_object('success', false, 'error', SQLERRM);
    END;
    $$;
  `;

    // We run this using the OLD exec_sql (which just executes and returns success)
    const { data, error } = await supabase.rpc('exec_sql', { sql: upgradeSQL });

    if (error) {
        console.error('❌ Failed to upgrade function:', error.message);
    } else {
        // Check internal success
        if (data && !data.success) {
            console.error('❌ Failed to upgrade function (SQL error):', data.error);
        } else {
            console.log('✅ exec_sql function upgraded successfully!');

            // Test it
            console.log('Testing with SELECT 1...');
            const { data: testData } = await supabase.rpc('exec_sql', { sql: "SELECT 1 as val" });
            console.log('Test Result:', JSON.stringify(testData, null, 2));
        }
    }
}

upgradeExecSql();
