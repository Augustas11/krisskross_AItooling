const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function verifyEnrichedLeads() {
    try {
        console.log('🔍 VERIFYING "ENRICHED" LEADS QUALITY');
        console.log('=====================================\n');

        // Get all leads marked as enriched
        const { data: enrichedLeads, error } = await supabase
            .from('leads')
            .select('*')
            .eq('enriched', true);

        if (error) throw error;

        console.log(`Total leads marked as "enriched": ${enrichedLeads.length}\n`);

        // Define what "truly enriched" means (Triple Threat)
        let trulyEnriched = 0;
        let missingContact = 0;
        let missingCompany = 0;
        let missingAI = 0;
        let missingTags = 0;
        let missingMetrics = 0;

        const issues = [];

        enrichedLeads.forEach((lead, idx) => {
            const problems = [];

            // Check Contact Intelligence
            const hasEmail = !!lead.email;
            const hasPhone = !!lead.phone;
            const hasContactInfo = hasEmail || hasPhone;

            if (!hasContactInfo) {
                problems.push('No email or phone');
                missingContact++;
            }

            // Check Company Intelligence
            const hasInstagram = !!lead.instagram;
            const hasWebsite = !!lead.website;
            const hasCompanyPresence = hasInstagram && hasWebsite;

            if (!hasCompanyPresence) {
                if (!hasInstagram) problems.push('No Instagram');
                if (!hasWebsite) problems.push('No website');
                missingCompany++;
            }

            // Check AI Analysis
            const hasAIResearch = !!lead.ai_research_summary;
            if (!hasAIResearch) {
                problems.push('No AI research summary');
                missingAI++;
            }

            // Check Tags
            const hasTags = lead.tags && lead.tags.length > 0;
            if (!hasTags) {
                problems.push('No tags');
                missingTags++;
            }

            // Check Instagram Metrics
            const hasMetrics = lead.instagram_followers || lead.engagement_rate;
            if (!hasMetrics) {
                problems.push('No Instagram metrics');
                missingMetrics++;
            }

            // Check Scores
            const hasScores = lead.fit_score && lead.intent_score;
            if (!hasScores) {
                problems.push('Missing scores');
            }

            // Determine if truly enriched
            const isTrulyEnriched = hasContactInfo && hasCompanyPresence && hasAIResearch && hasTags && hasMetrics && hasScores;

            if (isTrulyEnriched) {
                trulyEnriched++;
            } else {
                issues.push({
                    name: lead.name,
                    id: lead.id,
                    problems: problems
                });
            }
        });

        console.log('📊 ENRICHMENT QUALITY ANALYSIS:');
        console.log('================================');
        console.log(`Truly Enriched (Complete): ${trulyEnriched}/${enrichedLeads.length} (${Math.round(trulyEnriched / enrichedLeads.length * 100)}%)`);
        console.log(`Falsely Marked as Enriched: ${enrichedLeads.length - trulyEnriched}/${enrichedLeads.length} (${Math.round((enrichedLeads.length - trulyEnriched) / enrichedLeads.length * 100)}%)\n`);

        console.log('Missing Data Breakdown:');
        console.log(`  Missing Contact Info: ${missingContact} leads`);
        console.log(`  Missing Company Presence: ${missingCompany} leads`);
        console.log(`  Missing AI Research: ${missingAI} leads`);
        console.log(`  Missing Tags: ${missingTags} leads`);
        console.log(`  Missing Instagram Metrics: ${missingMetrics} leads\n`);

        if (issues.length > 0) {
            console.log(`\n❌ LEADS WITH ISSUES (showing first 10):`);
            console.log('=========================================');
            issues.slice(0, 10).forEach((issue, idx) => {
                console.log(`\n${idx + 1}. ${issue.name} (${issue.id})`);
                console.log(`   Problems: ${issue.problems.join(', ')}`);
            });

            if (issues.length > 10) {
                console.log(`\n... and ${issues.length - 10} more leads with issues`);
            }
        }

        console.log('\n\n📈 RECOMMENDATION:');
        console.log('==================');
        if (trulyEnriched < enrichedLeads.length * 0.8) {
            console.log('⚠️  CRITICAL: Less than 80% of "enriched" leads are truly complete!');
            console.log('Action: Re-run enrichment on all leads marked as enriched but incomplete.');
        } else {
            console.log('✅ Most enriched leads are complete. Minor cleanup needed.');
        }

        // Calculate actual enrichment need
        const { count: totalCount } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true });

        const actualNeedEnrichment = totalCount - trulyEnriched;

        console.log(`\n🎯 ACTUAL ENRICHMENT NEEDED:`);
        console.log(`Total Leads: ${totalCount}`);
        console.log(`Truly Enriched: ${trulyEnriched}`);
        console.log(`Need Enrichment: ${actualNeedEnrichment} (${Math.round(actualNeedEnrichment / totalCount * 100)}%)`);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

verifyEnrichedLeads();
