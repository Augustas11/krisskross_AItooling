
require('dotenv').config({ path: '.env.local' });
const { enrichAndTagLead } = require('../lib/tags/enrichment.js');

async function testLiveEnrichment() {
    console.log('🚀 Starting Triple Threat LIVE Test...');
    console.log('------------------------------------------------');

    // Test Lead: The Gown Warehouse
    // Intentionally leaving out Instagram handle to test Perplexity discovery
    const lead = {
        id: 'test_live_run_' + Date.now(),
        name: 'The Gown Warehouse',
        website: 'https://www.thegownwarehouse.com/',
        // No phone, no email, no location, no instagram - initially
        tags: []
    };

    console.log('Driving Agent with Input Lead:', lead);

    try {
        const enrichedLead = await enrichAndTagLead(lead);

        console.log('------------------------------------------------');
        console.log('✅ TRIPLE THREAT COMPLETE');
        console.log('------------------------------------------------');
        console.log('FINAL ENRICHED LEAD DATA:');
        console.log(JSON.stringify(enrichedLead, null, 2));

        // Assertions/Checks for output
        console.log('\n--- VERIFICATION REPORT ---');
        console.log('1. Email found?', enrichedLead.email ? '✅' : '❌');
        console.log('2. Phone found?', enrichedLead.phone ? '✅' : '❌');
        console.log('3. Location found?', enrichedLead.location ? '✅' : '❌');
        console.log('4. Instagram found?', enrichedLead.instagram ? '✅ ' + enrichedLead.instagram : '❌');
        console.log('5. Website saved?', enrichedLead.website ? '✅' : '❌');
        console.log('6. TikTok saved?', enrichedLead.tiktok ? '✅' : '❌ (Might not exist)');
        console.log('7. AI Tags gen?', enrichedLead.tags.length > 0 ? '✅ (' + enrichedLead.tags.length + ')' : '❌');
        console.log('8. Source History?', enrichedLead.enrichmentHistory?.[0]?.method);

    } catch (error) {
        console.error('❌ TEST FAILED:', error);
    }
}

testLiveEnrichment();
