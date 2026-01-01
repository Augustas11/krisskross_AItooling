/**
 * Lead Enrichment with Apify + AI Tagging
 * Integrates existing SocialAnalyzer with auto-tagging engine
 */

// ... (imports)
import { SocialAnalyzer } from '../social-analyzer.js';
import { analyzeLeadForTags } from './ai-analyzer.js';
import { autoTagLead } from './auto-tagger.js';
import { addTag, removeTagsByCategory } from './utils.js';
import { calculatePostingFrequency } from './auto-tagger.js';
import { researchLead } from '../perplexity.js'; // Import Perplexity service

export async function enrichAndTagLead(lead, options = {}) {
    console.log(`[ENRICH] Starting enrichment for lead ${lead.id}`);

    // Clean slate: Remove existing auto/ai tags
    if (lead.tags) {
        lead.tags = lead.tags.filter(t => t.applied_by === 'manual');
    }

    // 1. Prepare Data Fetching Promises
    const tasks = [];

    // Task A: Apify Instagram Metrics
    let handle = null;
    if (lead.instagram && lead.instagram !== 'N/A') {
        handle = SocialAnalyzer.extractInstagramHandle(lead.instagram);
    }

    if (handle) {
        console.log(`[ENRICH] Fetching Instagram metrics for @${handle}...`);
        tasks.push(
            SocialAnalyzer.fetchInstagramMetrics(handle)
                .then(res => ({ type: 'APIFY', data: res }))
                .catch(err => ({ type: 'APIFY', error: err }))
        );
    } else {
        console.log('[ENRICH] No Instagram handle, skipping Apify.');
    }

    // Task B: Perplexity Deep Research
    if (process.env.PERPLEXITY_API_KEY) {
        console.log(`[ENRICH] Starting Perplexity deep research...`);
        tasks.push(
            researchLead(lead)
                .then(res => ({ type: 'PERPLEXITY', data: res }))
                .catch(err => ({ type: 'PERPLEXITY', error: err }))
        );
    } else {
        console.warn('⚠️ [ENRICH] No PERPLEXITY_API_KEY found. Skipping deep research.');
    }

    // 2. Wait for all data (Parallel Execution)
    const results = await Promise.all(tasks);

    // 3. Process Results
    const apifyResult = results.find(r => r.type === 'APIFY');
    const perplexityResult = results.find(r => r.type === 'PERPLEXITY');

    let metrics = {};
    let researchSummary = '';

    // Handle Apify Data
    if (apifyResult?.data) {
        metrics = apifyResult.data;
        lead.instagramFollowers = metrics.followers;
        lead.engagementRate = metrics.engagementRate;
        lead.instagram = handle;

        if (metrics.posts) {
            const estimatedWeeks = 52;
            const postsPerWeek = metrics.posts / estimatedWeeks;
            lead.posting_frequency = calculatePostingFrequency(postsPerWeek * 4.3);
        }
    }

    // Handle Perplexity Data
    if (perplexityResult?.data) {
        researchSummary = perplexityResult.data;
        lead.ai_research_summary = researchSummary; // Provide this to UI later if needed
    }

    // 4. AI Tagging (Claude) - Combining ALL Intelligence
    if (!options.skipAI && process.env.ANTHROPIC_API_KEY) {
        console.log(`[ENRICH] Analyzing combined context with AI...`);

        const latestPosts = metrics?.latestPosts || [];

        // Construct RICH context
        const context = {
            ...lead,
            biography: metrics?.biography || lead.biography,
            // Explicitly pass the research notes to the analyzer
            researchNotes: researchSummary
        };

        const aiTags = await analyzeLeadForTags(latestPosts, context);

        if (aiTags && aiTags.length > 0) {
            aiTags.forEach(tag => {
                const category = tag.full_tag.split(':')[0];
                if (['business', 'content', 'posting'].includes(category)) {
                    removeTagsByCategory(lead, category);
                }
                addTag(lead, tag.full_tag, {
                    applied_by: 'ai',
                    confidence: tag.confidence,
                    evidence: tag.evidence
                });
            });
            console.log(`[ENRICH] Applied ${aiTags.length} AI tags`);
        }
    }

    // 5. Final Auto-Tagging Fallback (Fill gaps)
    await autoTagLead(lead);

    lead.enriched = true;
    lead.lastEnrichedAt = new Date().toISOString();

    return lead;
}

/**
 * Batch enrich multiple leads
 * @param {array} leads - Array of lead objects
 * @param {object} options - Enrichment options
 * @returns {object} Results with enriched leads and statistics
 */
export async function batchEnrichAndTag(leads, options = {}) {
    console.log(`[ENRICH] Starting batch enrichment for ${leads.length} leads`);

    const results = {
        total: leads.length,
        enriched: 0,
        failed: 0,
        skipped: 0,
        leads: []
    };

    for (let i = 0; i < leads.length; i++) {
        const lead = leads[i];

        // Progress indicator
        if (i % 10 === 0) {
            console.log(`[ENRICH] Progress: ${i}/${leads.length} (${Math.round(i / leads.length * 100)}%)`);
        }

        try {
            // Check if lead has Instagram handle
            if (!lead.instagram || lead.instagram === 'N/A') {
                console.log(`[ENRICH] Skipping lead ${lead.id} - no Instagram handle`);
                results.skipped++;
                results.leads.push(lead);
                continue;
            }

            const enrichedLead = await enrichAndTagLead(lead, options);
            results.enriched++;
            results.leads.push(enrichedLead);

            // Rate limiting: Wait 1 second between API calls to avoid hitting limits
            if (i < leads.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

        } catch (error) {
            console.error(`[ENRICH] Failed to enrich lead ${lead.id}:`, error);
            results.failed++;
            results.leads.push(lead); // Include failed lead
        }
    }

    console.log(`[ENRICH] Batch enrichment complete`);
    console.log(`  Enriched: ${results.enriched}`);
    console.log(`  Skipped: ${results.skipped}`);
    console.log(`  Failed: ${results.failed}`);

    return results;
}
