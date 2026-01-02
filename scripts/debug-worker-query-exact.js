const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function debugExact() {
    console.log('🐞 Debugging EXACT Worker Query...');

    // Exact string from route.js
    const fetchSQL = `
      SELECT 
        eq.id as queue_id, 
        eq.attempts, 
        l.* 
      FROM public.enrichment_queue eq 
      JOIN public.leads l ON eq.lead_id = l.id 
      WHERE eq.status = 'pending' 
      ORDER BY eq.priority ASC, eq.created_at ASC 
      LIMIT 1
    `;

    try {
        const { data: fetchResult, error: fetchError } = await supabase.rpc('exec_sql', { sql: fetchSQL.trim() });

        if (fetchError) {
            console.error('RPC Error:', fetchError);
        } else {
            console.log('Result Success:', fetchResult.success);
            if (fetchResult.data) {
                console.log('Result Rows:', fetchResult.data.length);
                if (fetchResult.data.length > 0) {
                    console.log('First Row Keys:', Object.keys(fetchResult.data[0]));
                    console.log('First Row ID:', fetchResult.data[0].id);
                }
            } else {
                console.log('Result Data is null/undefined');
                console.log('Full Result:', JSON.stringify(fetchResult));
            }
        }
    } catch (e) {
        console.error('Exception:', e);
    }
}

debugExact();
