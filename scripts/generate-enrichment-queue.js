const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function generateQueue() {
    console.log('📋 Generating Enrichment Queue...');

    // 1. Fetch leads
    const { data: leads, error } = await supabase.from('leads').select('*');
    if (error) {
        console.error('❌ Error fetching leads:', error.message);
        process.exit(1);
    }

    // 2. Clear existing pending queue (optional, but good for reset)
    // console.log('Cleaning pending queue...');
    // await supabase.from('enrichment_queue').delete().eq('status', 'pending');

    const queueItems = [];
    const now = new Date();

    for (const lead of leads) {
        // skip if already complete
        if (lead.enrichment_status === 'complete') continue;

        let priority = 5; // Default (Backfill)
        let reason = 'Standard backfill';

        const daysOld = (now - new Date(lead.created_at)) / (1000 * 60 * 60 * 24);

        if (daysOld <= 7) {
            priority = 1;
            reason = 'New Lead (<7 days)';
        } else if (daysOld <= 30) {
            priority = 2;
            reason = 'Warm Lead (<30 days)';
        } else if (lead.fit_score >= 70) {
            priority = 3;
            reason = 'High Intent / Fit Score';
        }
        // Additional logic: if we found gaps in audit, we could prioritize, but keeping it simple is better for now.

        queueItems.push({
            lead_id: lead.id,
            priority,
            reason,
            status: 'pending',
            attempts: 0
        });
    }

    // 3. Bulk Insert using execute_sql to bypass Schema Cache issues
    if (queueItems.length > 0) {
        console.log(`🚀 Adding ${queueItems.length} leads to queue (via raw SQL)...`);

        // Process in chunks of 50
        const chunkSize = 50;
        for (let i = 0; i < queueItems.length; i += chunkSize) {
            const chunk = queueItems.slice(i, i + chunkSize);

            // Construct raw SQL INSERT
            // (id, lead_id, priority, reason, status, attempts)
            const values = chunk.map(item => {
                // Safe string escaping for reason
                const safeReason = item.reason.replace(/'/g, "''");
                return `(gen_random_uuid(), '${item.lead_id}', ${item.priority}, '${safeReason}', 'pending', 0)`;
            }).join(',\n');

            const sql = `
        INSERT INTO enrichment_queue (id, lead_id, priority, reason, status, attempts)
        VALUES 
        ${values}
        ON CONFLICT DO NOTHING;
      `;

            const {
                data,
                error: insertError
            } = await supabase.rpc('exec_sql', {
                sql
            });

            if (insertError) {
                console.error('❌ RPC Error inserting chunk:', insertError.message);
            } else if (data && !data.success) {
                console.error('❌ SQL Error inserting chunk:', data.error);
            } else {
                process.stdout.write('.');
            }
        }
        console.log('\n✅ Queue generation complete (via SQL)!');
    } else {
        console.log('✅ Queue is already empty (all leads enriched?)');
    }
}

generateQueue();
