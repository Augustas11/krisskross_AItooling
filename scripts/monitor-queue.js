const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function monitor() {
    const startTime = Date.now();
    let initialCompleted = 0;
    let firstRun = true;

    console.log('📡 Connecting to Queue...');

    while (true) {
        try {
            const { data: result, error } = await supabase.rpc('exec_sql', {
                sql: "SELECT status, count(*) as count FROM public.enrichment_queue GROUP BY status"
            });

            if (error || !result?.success) {
                console.error('Error fetching stats:', error || result?.error);
            } else {
                const rows = result.data || [];
                const stats = {
                    pending: 0,
                    processing: 0,
                    completed: 0,
                    failed: 0,
                    total: 0
                };

                rows.forEach(r => {
                    stats[r.status] = parseInt(r.count, 10);
                    stats.total += parseInt(r.count, 10);
                });

                if (firstRun) {
                    initialCompleted = stats.completed;
                    firstRun = false;
                }

                // Calculate rates
                const completedSinceStart = stats.completed - initialCompleted;
                const elapsedSeconds = (Date.now() - startTime) / 1000;
                const ratePerMinute = completedSinceStart > 0
                    ? (completedSinceStart / elapsedSeconds) * 60
                    : 0;

                const remaining = stats.pending + stats.processing;
                const etaMinutes = ratePerMinute > 0 ? Math.ceil(remaining / (ratePerMinute / 60) / 60) : '?';

                // Display
                console.clear();
                console.log('\n📊 ENRICHMENT QUEUE MONITOR');
                console.log('===========================');
                console.log(`Total Leads:   ${stats.total}`);
                console.log(`✅ Completed:  ${stats.completed}`);
                console.log(`⏳ Pending:    ${stats.pending}`);
                console.log(`⚙️  Processing: ${stats.processing}`);
                console.log(`❌ Failed:     ${stats.failed}`);
                console.log('---------------------------');

                // Progress Bar
                const percent = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
                const barLength = 20;
                const filled = Math.round((percent / 100) * barLength);
                const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);

                console.log(`Progress: [${bar}] ${percent}%`);

                if (completedSinceStart > 0) {
                    console.log(`Speed:    ${ratePerMinute.toFixed(1)} leads/min`);
                    // console.log(`ETA:      ~${etaMinutes} mins`); // ETA is tricky, maybe skip or simple
                } else {
                    console.log(`Speed:    Calculating...`);
                }

                console.log('\n(Press Ctrl+C to exit monitor)');
            }

        } catch (e) {
            console.error('Connection Error:', e.message);
        }

        await new Promise(r => setTimeout(r, 2000));
    }
}

monitor();
