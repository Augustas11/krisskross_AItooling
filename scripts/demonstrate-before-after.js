const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function demonstrate() {
    console.log('🕵️‍♀️ Looking for a target lead to monitor...');

    // 1. Find a pending lead (Priority Order)
    const { data: queueItems } = await supabase.rpc('exec_sql', {
        sql: "SELECT lead_id FROM public.enrichment_queue WHERE status = 'pending' ORDER BY priority ASC, created_at ASC LIMIT 1"
    });

    if (!queueItems || !queueItems.data || queueItems.data.length === 0) {
        console.log('No pending items found!');
        return;
    }

    const targetId = queueItems.data[0].lead_id;
    console.log(`🎯 Target Locked: ${targetId}`);

    // 2. Capture BEFORE State
    const { data: before } = await supabase.rpc('exec_sql', {
        sql: `SELECT id, email, enrichment_status, ai_research_summary, tags FROM public.leads WHERE id = '${targetId}'`
    });

    if (!before?.data?.[0]) { console.log('Lead not found in leads table?'); return; }

    const beforeLead = before.data[0];
    console.log('\n--- 🟥 BEFORE STATE (Database Snapshot) ---');
    console.log(`ID:        ${beforeLead.id}`);
    console.log(`Status:    ${beforeLead.enrichment_status || 'NULL'}`);
    console.log(`Research:  ${beforeLead.ai_research_summary ? '✅ Present' : '❌ NULL'}`);
    console.log(`Tags:      ${beforeLead.tags ? '✅ Present' : '❌ NULL'}`);
    console.log('-------------------------------------------');

    console.log('\n⏳ Waiting for Worker to process this lead (this triggers automatically, please wait ~15-30s)...');

    // 3. Poll for AFTER State
    let attempts = 0;
    while (attempts < 60) { // 60 * 2s = 2 mins max
        await new Promise(r => setTimeout(r, 2000));
        process.stdout.write('.');
        attempts++;

        const { data: check } = await supabase.rpc('exec_sql', {
            sql: `SELECT id, email, enrichment_status, ai_research_summary, tags FROM public.leads WHERE id = '${targetId}'`
        });

        const current = check?.data?.[0];
        if (current && current.enrichment_status === 'complete') {
            console.log('\n\n✨ TRANSITION DETECTED! ✨');
            console.log('\n--- 🟩 AFTER STATE (Database Snapshot) ---');
            console.log(`ID:        ${current.id}`);
            console.log(`Status:    ${current.enrichment_status}`);
            console.log(`Research:  ${(current.ai_research_summary || '').substring(0, 100)}...`);

            if (current.tags && Array.isArray(current.tags)) {
                console.log('\n🧠 AI Tags Analysis:');
                current.tags.forEach(t => {
                    try {
                        const tagObj = typeof t === 'string' ? JSON.parse(t) : t;
                        console.log(`   🔸 [${tagObj.full_tag}] (Conf: ${tagObj.confidence})`);
                        if (tagObj.evidence) console.log(`      Evidence: ${tagObj.evidence}`);
                    } catch (e) { console.log(`   🔸 ${t}`); }
                });
            } else {
                console.log(`Tags: ${JSON.stringify(current.tags)}`);
            }

            console.log('------------------------------------------');
            console.log('✅ PROOF: Database state changed from NULL to POPULATED.');
            return;
        }
    }

    console.log('\n❌ Timed out waiting for this specific lead. The worker might be busy with others or stuck.');
}

demonstrate();
