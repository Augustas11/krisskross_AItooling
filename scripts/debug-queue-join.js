const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function debugJoin() {
    console.log('🐞 Debugging JOIN...');

    // 1. Check simple queue count
    const { data: q1 } = await supabase.rpc('exec_sql', { sql: "SELECT count(*) FROM public.enrichment_queue" });
    console.log('Queue Count:', JSON.stringify(q1?.data));

    // 2. Check simple leads count (limit to confirm access)
    const { data: q2 } = await supabase.rpc('exec_sql', { sql: "SELECT count(*) FROM public.leads" });
    console.log('Leads Count:', JSON.stringify(q2?.data));

    // 3. Check JOIN count
    const { data: q3 } = await supabase.rpc('exec_sql', {
        sql: "SELECT count(*) FROM public.enrichment_queue eq JOIN public.leads l ON eq.lead_id = l.id"
    });
    console.log('JOIN Count:', JSON.stringify(q3?.data));

    // 4. Sample IDs to compare
    const { data: sampleQ } = await supabase.rpc('exec_sql', { sql: "SELECT lead_id FROM public.enrichment_queue LIMIT 1" });
    const idFromQueue = sampleQ?.data?.[0]?.lead_id;

    if (idFromQueue) {
        console.log(`Sample ID from Queue: '${idFromQueue}'`);
        // Try exact look up
        const { data: exact } = await supabase.rpc('exec_sql', {
            sql: `SELECT id FROM public.leads WHERE id = '${idFromQueue}'`
        });
        console.log(`Direct Lookup for '${idFromQueue}':`, JSON.stringify(exact?.data));
    }
}

debugJoin();
