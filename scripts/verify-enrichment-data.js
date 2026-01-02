const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function verifyData() {
    console.log('🧐 Verifying Enriched Data Quality...');

    const { data: leads, error } = await supabase.rpc('exec_sql', {
        sql: `
        SELECT 
            id, 
            enrichment_status,
            ai_research_summary, 
            tags, 
            email, 
            phone, 
            instagram, 
            website, 
            business_address,
            enrichment_history
        FROM public.leads
    `.trim()
    });

    if (error || !leads?.success) {
        console.error('Error fetching leads:', error || leads?.error);
        return;
    }

    const rows = leads.data;
    const total = rows.length;
    console.log(`Total Leads Checked: ${total}`);

    const metrics = {
        enriched_status: 0,
        has_research: 0,
        has_tags: 0,
        has_email: 0,
        has_phone: 0,
        has_instagram: 0,
        has_website: 0,
        has_location: 0,
        has_history: 0,
        total_tags: 0
    };

    rows.forEach(l => {
        if (l.enrichment_status === 'complete') metrics.enriched_status++;
        if (l.ai_research_summary && l.ai_research_summary.length > 20) metrics.has_research++;
        if (l.tags && l.tags.length > 0) {
            metrics.has_tags++;
            metrics.total_tags += l.tags.length;
        }
        if (l.email) metrics.has_email++;
        if (l.phone) metrics.has_phone++;
        if (l.instagram) metrics.has_instagram++;
        if (l.website) metrics.has_website++;
        if (l.business_address) metrics.has_location++;
        if (l.enrichment_history && l.enrichment_history.length > 0) metrics.has_history++;
    });

    const fmt = (count) => `${count} (${((count / total) * 100).toFixed(1)}%)`;

    console.log('\n📈 Coverage Metrics:');
    console.log('-------------------');
    console.log(`Enrichment Status 'complete': ${fmt(metrics.enriched_status)}`);
    console.log(`AI Research Summary:          ${fmt(metrics.has_research)}`);
    console.log(`AI Tags:                      ${fmt(metrics.has_tags)}`);
    console.log(`Email Address:                ${fmt(metrics.has_email)}`);
    console.log(`Phone Number:                 ${fmt(metrics.has_phone)}`);
    console.log(`Instagram Handle:             ${fmt(metrics.has_instagram)}`);
    console.log(`Website:                      ${fmt(metrics.has_website)}`);
    console.log(`Location:                     ${fmt(metrics.has_location)}`);
    console.log(`Enrichment History Log:       ${fmt(metrics.has_history)}`);

    if (metrics.has_tags > 0) {
        console.log(`Avg Tags per Enriched Lead:   ${(metrics.total_tags / metrics.has_tags).toFixed(1)}`);
    }
}

verifyData();
