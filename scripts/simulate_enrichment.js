
import { researchLead } from '../lib/perplexity.js';
import { SocialAnalyzer } from '../lib/social-analyzer.js';
import { analyzeLeadForTags } from '../lib/tags/ai-analyzer.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function runTest() {
    console.log('--- STARTING TRIPLE-THREAT TEST (REAL APIFY + PERPLEXITY + CLAUDE) ---');
    console.log('Target Lead: Arach&Cloz (@arachcloz)');

    const lead = {
        id: 'test-123',
        name: 'Arach&Cloz',
        website: 'arach-cloz.com',
        instagram: 'arachcloz', // Input provided
        briefDescription: 'Imported via CSV',
    };

    // 1. REAL Apify Call
    console.log('\n[1] Fetching Apify Instagram Data...');
    let apifyMetrics = null;
    try {
        // We call the static method directly
        apifyMetrics = await SocialAnalyzer.fetchInstagramMetrics('arachcloz');
        console.log('\n[APIFY RESULT (raw metrics)]:');
        // Log purely the object returned by SocialAnalyzer
        console.log(JSON.stringify(apifyMetrics, null, 2));
    } catch (e) {
        console.error('Apify Failed:', e.message);
    }

    // 2. REAL Perplexity Call
    console.log('\n[2] Fetching Perplexity Research...');
    let researchNotes = null;
    try {
        researchNotes = await researchLead(lead);
        console.log('\n[PERPLEXITY RESULT]:');
        console.log(researchNotes ? researchNotes.substring(0, 500) + '...' : 'No result');
    } catch (e) {
        console.error('Perplexity Failed:', e.message);
    }

    // 3. REAL Claude Analysis
    console.log('\n[3] Sending Combined Data to Claude...');

    // Construct rich context manually to simulate enrichment.js
    const context = {
        ...lead,
        biography: apifyMetrics?.biography || lead.biography,
        instagramBusinessCategory: apifyMetrics?.businessCategory,
        hasReels: apifyMetrics?.hasReels,
        avgVideoViews: apifyMetrics?.avgVideoViews,
        researchNotes: researchNotes
    };

    // Use Apify posts if available, otherwise empty
    const latestPosts = apifyMetrics?.latestPosts || [];

    try {
        const tags = await analyzeLeadForTags(latestPosts, context);

        console.log('\n--- REAL CLAUDE RESPONSE ---');
        console.log(JSON.stringify(tags, null, 2));

        console.log('\n-------------------------------------');
        console.log(`Total Tags Generated: ${tags.length}`);

    } catch (error) {
        console.error('Claude Analysis Failed:', error);
    }
}

runTest();
