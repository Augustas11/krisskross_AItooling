const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function analyze() {
    console.log('🕵️‍♀️ Analyzing Worker Performance & Data Integrity...');

    // 1. Fetch all queue items + joined lead data
    // We grab updated_at to calc speed, and error_log for failure analysis
    const { data: result, error } = await supabase.rpc('exec_sql', {
        sql: `
      SELECT 
        eq.id, 
        eq.status, 
        eq.created_at as queued_at, 
        eq.updated_at as processed_at, 
        eq.attempts, 
        eq.error_log,
        l.enrichment_status as lead_status,
        l.ai_research_summary,
        l.tags,
        l.website,
        l.instagram
      FROM public.enrichment_queue eq
      LEFT JOIN public.leads l ON eq.lead_id = l.id
    `.trim()
    });

    if (error || !result?.success) {
        console.error('Error fetching data:', error || result?.error);
        return;
    }

    const rows = result.data;
    const total = rows.length;
    const completed = rows.filter(r => r.status === 'completed');
    const failed = rows.filter(r => r.status === 'failed');
    const pending = rows.filter(r => r.status === 'pending');
    const processing = rows.filter(r => r.status === 'processing');

    // --- PROCESSING SPEED ---
    // Sort completed by processed_at to find the "active window"
    const sortedCompleted = completed
        .filter(r => r.processed_at)
        .sort((a, b) => new Date(a.processed_at) - new Date(b.processed_at));

    let speedMetrics = 'N/A';
    if (sortedCompleted.length > 1) {
        const start = new Date(sortedCompleted[0].processed_at);
        const end = new Date(sortedCompleted[sortedCompleted.length - 1].processed_at);
        const minutes = (end - start) / 60000;
        const leadsPerMin = minutes > 0 ? (sortedCompleted.length / minutes).toFixed(2) : 0;
        speedMetrics = `${leadsPerMin} leads/min (over checkout window of ${minutes.toFixed(1)} mins)`;
    }

    // --- ERROR ANALYSIS ---
    const errorCounts = {};
    failed.forEach(r => {
        if (r.error_log && r.error_log.length > 0) {
            // Get latest error
            const lat = r.error_log[r.error_log.length - 1];
            const msg = lat.error || 'Unknown Error';
            errorCounts[msg] = (errorCounts[msg] || 0) + 1;
        } else {
            errorCounts['Silent Failure (No Log)'] = (errorCounts['Silent Failure (No Log)'] || 0) + 1;
        }
    });

    // --- DISCREPANCIES ---
    // 1. Status Mismatch: Queue says 'completed', Lead says 'not_enriched' or null
    const statusMismatch = completed.filter(r => r.lead_status !== 'complete');

    // 2. Ghost Completion: Queue says 'completed', but critical fields are empty
    const ghostCompletion = completed.filter(r =>
        !r.ai_research_summary ||
        !r.tags ||
        r.tags.length === 0
    );

    // 3. Stuck Jobs: Status 'processing' for > 10 mins
    const now = new Date();
    const stuckJobs = processing.filter(r => {
        const updated = new Date(r.processed_at);
        return (now - updated) > 10 * 60 * 1000;
    });

    console.log('\n📊 PERFORMANCE METRICS');
    console.log('======================');
    console.log(`Total Queue Items: ${total}`);
    console.log(`Active Speed:      ${speedMetrics}`);
    console.log(`Success Rate:      ${((completed.length / total) * 100).toFixed(1)}% (${completed.length}/${total})`);

    console.log('\n❌ ERROR ANALYSIS');
    if (Object.keys(errorCounts).length > 0) {
        Object.entries(errorCounts).forEach(([err, count]) => {
            console.log(`  [${count}] ${err.substring(0, 80)}...`);
        });
    } else {
        console.log('  No failures recorded.');
    }

    console.log('\n⚠️  DISCREPANCIES');
    console.log(`  Stuck 'Processing' (>10m):   ${stuckJobs.length}`);
    console.log(`  Queue/Lead Status Mismatch:  ${statusMismatch.length}`);
    console.log(`  Ghost Completions (No Data): ${ghostCompletion.length}`);

    if (ghostCompletion.length > 0) {
        console.log('\n  Ghost Detail (First 3):');
        ghostCompletion.slice(0, 3).forEach(g => {
            console.log(`    - ID: ${g.id} | Research: ${!!g.ai_research_summary} | Tags: ${!!g.tags}`);
        });
    }
}

analyze();
