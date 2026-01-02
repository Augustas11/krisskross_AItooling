const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const API_URL = process.env.WORKER_API_URL || 'http://localhost:3000/api/worker/process-queue';

async function runWorker() {
    console.log('👷 Starting Local Enrichment Worker...');
    console.log(`📡 Connected to: ${API_URL}`);

    let consecutiveErrors = 0;
    let processedCount = 0;

    while (true) {
        try {
            console.log('\n⏳ Requesting next job...');

            const start = Date.now();
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const duration = Date.now() - start;
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || `HTTP ${response.status}`);
            }

            if (result.message === 'Queue empty') {
                console.log('😴 Queue empty. Waiting 10 seconds...');
                await new Promise(r => setTimeout(r, 10000));
                continue;
            }

            if (result.success) {
                processedCount++;
                console.log(`✅ Processed Lead ${result.leadId} in ${duration}ms`);
                consecutiveErrors = 0;
            } else {
                console.warn('⚠️  Job returned success=false:', result);
            }

            // Small delay to prevent hammering if local
            await new Promise(r => setTimeout(r, 1000));

        } catch (error) {
            consecutiveErrors++;
            console.error(`❌ Worker Error (${consecutiveErrors}/5):`, error.message);

            if (consecutiveErrors >= 5) {
                console.error('🔥 Too many consecutive errors. Stopping worker.');
                process.exit(1);
            }

            // Backoff
            const delay = Math.min(30000, 1000 * Math.pow(2, consecutiveErrors));
            console.log(`Waiting ${delay}ms before retry...`);
            await new Promise(r => setTimeout(r, delay));
        }
    }
}

// Check if server is running
fetch(API_URL.replace('/api/worker/process-queue', ''))
    .then(() => runWorker())
    .catch((err) => {
        console.error('❌ Could not connect to localhost:3000.');
        console.error('Please ensure your Next.js server is running via `npm run dev`');
        process.exit(1);
    });
