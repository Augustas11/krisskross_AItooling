const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function auditLeads() {
    console.log('🔍 Starting Comprehensive Lead Audit...');

    const { data: leads, error } = await supabase
        .from('leads')
        .select('*');

    if (error) {
        console.error('❌ Error fetching leads:', error.message);
        process.exit(1);
    }

    console.log(`📊 analyzing ${leads.length} leads...`);

    const stats = {
        total: leads.length,
        complete: 0,
        partial: 0,
        not_enriched: 0,
        failed: 0,
        stale: 0,
        inconsistent: 0,
        missing_triple_threat: {
            company: 0,
            contact: 0,
            intent: 0
        }
    };

    const report = leads.map(lead => {
        const issues = [];

        // 1. Triple Threat Checks
        const hasCompany = !!(lead.instagram && lead.website);
        const hasContact = !!(lead.email || lead.phone);
        const hasIntent = !!(lead.ai_research_summary && lead.tags && lead.tags.length > 0);

        // Track specific gaps
        if (!hasCompany) stats.missing_triple_threat.company++;
        if (!hasContact) stats.missing_triple_threat.contact++;
        if (!hasIntent) stats.missing_triple_threat.intent++;

        // 2. Data Quality Checks (Inconsistencies)
        // Check for "empty" but "present" fields or invalid URLs
        if (lead.website && !lead.website.startsWith('http')) issues.push('invalid_website_url');
        if (lead.instagram && lead.instagram.includes('instagram.com')) issues.push('unclean_instagram_handle');

        // 3. Stale Data
        // Check updated_at - logic: if older than 90 days.
        const isStale = lead.updated_at && (new Date() - new Date(lead.updated_at)) > (90 * 24 * 60 * 60 * 1000);
        if (isStale) issues.push('stale_data');

        // Determine Status for Stats
        let internalStatus = 'not_enriched';
        if (hasCompany && hasContact && hasIntent) {
            internalStatus = 'complete';
            stats.complete++;
        } else if (hasCompany || hasContact || hasIntent) {
            internalStatus = 'partial';
            stats.partial++;
        } else {
            stats.not_enriched++;
        }

        if (issues.length > 0) stats.inconsistent++;
        if (isStale) stats.stale++;

        return {
            id: lead.id,
            name: lead.name || lead.company_name,
            status: internalStatus,
            issues,
            gaps: {
                company: !hasCompany,
                contact: !hasContact,
                intent: !hasIntent
            }
        };
    });

    console.log('\n📊 AUDIT RESULTS');
    console.log('=================');
    console.log(`Total Leads: ${stats.total}`);
    console.log(`✅ Complete Triple Threat: ${stats.complete} (${Math.round(stats.complete / stats.total * 100)}%)`);
    console.log(`⚠️  Partial Data: ${stats.partial}`);
    console.log(`🔴 Not Enriched: ${stats.not_enriched}`);
    console.log(`🛠  Inconsistent Data Issues: ${stats.inconsistent}`);
    console.log(`🕰  Stale (>90 days): ${stats.stale}`);
    console.log('\nTRIPLE THREAT GAPS:');
    console.log(`- Missing Company Info: ${stats.missing_triple_threat.company}`);
    console.log(`- Missing Contact Info: ${stats.missing_triple_threat.contact}`);
    console.log(`- Missing Intent (AI/Tags): ${stats.missing_triple_threat.intent}`);

    // Save detailed report
    fs.writeFileSync('enrichment-audit-report.json', JSON.stringify({ stats, details: report }, null, 2));
    console.log('\n📝 Report saved to enrichment-audit-report.json');
}

auditLeads();
