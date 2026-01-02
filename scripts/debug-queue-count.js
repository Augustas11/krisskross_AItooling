const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function debugQueue() {
    console.log('🐞 Debugging Queue...');

    // 1. Count pending
    const { data: countData } = await supabase.rpc('exec_sql', {
        sql: "SELECT count(*) FROM public.enrichment_queue WHERE status = 'pending'"
    });
    console.log('Pending Count:', JSON.stringify(countData));

    // 2. Sample 1 item
    const { data: sample } = await supabase.rpc('exec_sql', {
        sql: "SELECT * FROM public.enrichment_queue LIMIT 1"
    });
    console.log('Sample Item:', JSON.stringify(sample));

    if (sample && sample[0]) {
        const leadId = sample[0].lead_id;
        console.log(`Checking Lead ID: ${leadId}`);

        // 3. Check Lead existence
        const { data: lead } = await supabase.rpc('exec_sql', {
            sql: `SELECT * FROM public.leads WHERE id = '${leadId}'::uuid`
        });
        console.log('Matched Lead:', JSON.stringify(lead));
    }
}

debugQueue();
