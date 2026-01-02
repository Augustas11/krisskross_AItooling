const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function getLeadStats() {
    try {
        // Get total count
        const { count: totalCount, error: countError } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true });

        if (countError) throw countError;

        console.log('📊 ACTUAL LEAD STATISTICS (KrissKross CRM):');
        console.log('==========================================');
        console.log(`Total Leads in Database: ${totalCount}`);

        // Get enrichment status breakdown using EXISTING fields only
        const { data: allLeads, error: leadsError } = await supabase
            .from('leads')
            .select('enriched, ai_research_summary, instagram, email, phone, website, name, instagram_followers, engagement_rate, fit_score, intent_score, tags, enrichment_history');

        if (leadsError) throw leadsError;

        let enriched = 0;
        let hasResearch = 0;
        let hasInstagram = 0;
        let hasEmail = 0;
        let hasPhone = 0;
        let hasWebsite = 0;
        let hasMetrics = 0;
        let hasScores = 0;
        let hasTags = 0;
        let hasEnrichmentHistory = 0;

        // Triple Threat Analysis
        let completeCompany = 0;
        let completeContact = 0;
        let completeIntent = 0;
        let allThreeComplete = 0;

        allLeads.forEach(lead => {
            if (lead.enriched) enriched++;
            if (lead.ai_research_summary) hasResearch++;
            if (lead.instagram) hasInstagram++;
            if (lead.email) hasEmail++;
            if (lead.phone) hasPhone++;
            if (lead.website) hasWebsite++;
            if (lead.instagram_followers || lead.engagement_rate) hasMetrics++;
            if (lead.fit_score || lead.intent_score) hasScores++;
            if (lead.tags && lead.tags.length > 0) hasTags++;
            if (lead.enrichment_history && lead.enrichment_history.length > 0) hasEnrichmentHistory++;

            // Triple Threat Analysis (based on existing schema)
            const companyComplete = !!(lead.instagram && lead.website);
            const contactComplete = !!(lead.email || lead.phone);
            const intentComplete = !!(lead.fit_score && lead.intent_score);

            if (companyComplete) completeCompany++;
            if (contactComplete) completeContact++;
            if (intentComplete) completeIntent++;
            if (companyComplete && contactComplete && intentComplete) allThreeComplete++;
        });

        console.log(`\nEnrichment Status:`);
        console.log(`  Marked as Enriched: ${enriched} (${Math.round(enriched / totalCount * 100)}%)`);
        console.log(`  Has AI Research Summary: ${hasResearch} (${Math.round(hasResearch / totalCount * 100)}%)`);
        console.log(`  Has Instagram Metrics: ${hasMetrics} (${Math.round(hasMetrics / totalCount * 100)}%)`);
        console.log(`  Has Fit/Intent Scores: ${hasScores} (${Math.round(hasScores / totalCount * 100)}%)`);
        console.log(`  Has AI Tags: ${hasTags} (${Math.round(hasTags / totalCount * 100)}%)`);
        console.log(`  Has Enrichment History: ${hasEnrichmentHistory} (${Math.round(hasEnrichmentHistory / totalCount * 100)}%)`);

        console.log(`\nContact Data Completeness:`);
        console.log(`  Has Instagram: ${hasInstagram} (${Math.round(hasInstagram / totalCount * 100)}%)`);
        console.log(`  Has Email: ${hasEmail} (${Math.round(hasEmail / totalCount * 100)}%)`);
        console.log(`  Has Phone: ${hasPhone} (${Math.round(hasPhone / totalCount * 100)}%)`);
        console.log(`  Has Website: ${hasWebsite} (${Math.round(hasWebsite / totalCount * 100)}%)`);

        console.log(`\nTriple Threat Analysis (Current Schema):`);
        console.log(`  Company Intelligence: ${completeCompany} (${Math.round(completeCompany / totalCount * 100)}%)`);
        console.log(`  Contact Intelligence: ${completeContact} (${Math.round(completeContact / totalCount * 100)}%)`);
        console.log(`  Intent/Qualification: ${completeIntent} (${Math.round(completeIntent / totalCount * 100)}%)`);
        console.log(`  ALL THREE COMPLETE: ${allThreeComplete} (${Math.round(allThreeComplete / totalCount * 100)}%)`);

        console.log(`\nLeads Needing Work:`);
        const needsEnrichment = totalCount - enriched;
        const needsTripleThreat = totalCount - allThreeComplete;
        console.log(`  Not Enriched: ${needsEnrichment} (${Math.round(needsEnrichment / totalCount * 100)}%)`);
        console.log(`  Missing Triple Threat: ${needsTripleThreat} (${Math.round(needsTripleThreat / totalCount * 100)}%)`);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

getLeadStats();
