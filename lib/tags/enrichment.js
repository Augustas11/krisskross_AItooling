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
import { researchLeadWithGrok } from '../grok.js'; // Swapped Perplexity for Grok
import { parsePhoneNumber } from 'libphonenumber-js';

export async function enrichAndTagLead(lead, options = {}) {
    console.log(`[ENRICH] Starting enrichment for lead ${lead.id}`);

    // Clean slate: Remove existing auto/ai tags
    if (lead.tags) {
        lead.tags = lead.tags.filter(t => t.applied_by === 'manual');
    }

    // ---------------------------------------------------------
    // STEP 1: GROK (Deep Research) - Always runs first
    // ---------------------------------------------------------
    let researchSummary = '';
    let foundHandleFromPerplexity = null; // Variable name kept for compatibility, but comes from Grok

    if (process.env.GROK_API_KEY) {
        console.log(`[ENRICH] Step 1: Starting Grok deep research...`);
        try {
            const pData = await researchLeadWithGrok(lead);

            if (pData) {
                // 1. Research Summary
                if (typeof pData === 'string') {
                    researchSummary = pData;
                } else {
                    // console.log('🔍 [DEBUG] RAW DATA FROM PERPLEXITY:', JSON.stringify(pData, null, 2));
                    researchSummary = pData.summary || JSON.stringify(pData);

                    // 2. Fill in gaps not found by basic lead info
                    if (!lead.email && pData.email && pData.email !== 'N/A') lead.email = pData.email;
                    if (!lead.phone && pData.phone && pData.phone !== 'N/A') lead.phone = pData.phone;
                    if (!lead.location && pData.location) lead.location = pData.location;

                    // Map new social fields
                    if (!lead.website && pData.website && pData.website !== 'N/A') lead.website = pData.website;
                    if (!lead.tiktok && pData.tiktok && pData.tiktok !== 'N/A') lead.tiktok = pData.tiktok;

                    // Check for Instagram handle in Perplexity results
                    if (pData.instagram_handle) {
                        const rawHandle = pData.instagram_handle;
                        // Validate: Must not contain spaces (except trimmed), not too long
                        if (rawHandle && rawHandle !== 'N/A' && !rawHandle.includes(' ') && rawHandle.length < 50) {
                            foundHandleFromPerplexity = SocialAnalyzer.extractInstagramHandle(rawHandle);
                            if (foundHandleFromPerplexity) {
                                console.log(`[ENRICH] Grok found Instagram handle: ${foundHandleFromPerplexity}`);
                                // Update lead if not present
                                if (!lead.instagram) {
                                    lead.instagram = foundHandleFromPerplexity;
                                }
                            }
                        }
                    }

                    // 4. Update core info if better
                    if (pData.category) lead.productCategory = pData.category;
                }

                lead.ai_research_summary = researchSummary;
            }
        } catch (err) {
            console.error('[ENRICH] Grok failed:', err);
        }
    } else {
        console.warn('⚠️ [ENRICH] No GROK_API_KEY found. Skipping deep research.');
    }

    // ---------------------------------------------------------
    // STEP 2: APIFY (Instagram Metrics) - Runs if handle exists
    // ---------------------------------------------------------
    let metrics = {};
    let handle = null;

    // Determine handle: Use existing or the one found by Perplexity
    if (lead.instagram && lead.instagram !== 'N/A') {
        handle = SocialAnalyzer.extractInstagramHandle(lead.instagram);
    }

    if (handle) {
        console.log(`[ENRICH] Step 2: Fetching Instagram metrics for @${handle}...`);
        try {
            metrics = await SocialAnalyzer.fetchInstagramMetrics(handle);
            // console.log('📸 [DEBUG] RAW DATA FROM APIFY:', JSON.stringify(metrics, null, 2));

            if (metrics) {
                lead.instagramFollowers = metrics.followers;
                lead.engagementRate = metrics.engagementRate;
                // Ensure the handle is clean in the lead object
                lead.instagram = handle;

                if (metrics.posts) {
                    const estimatedWeeks = 52;
                    const postsPerWeek = metrics.posts / estimatedWeeks;
                    lead.posting_frequency = calculatePostingFrequency(postsPerWeek * 4.3);
                }
            }
        } catch (err) {
            console.error('[ENRICH] Apify failed:', err);
            // Fallback: If Apify failed, check if Perplexity had stats
            if (lead.ai_research_summary && typeof lead.ai_research_summary !== 'string') {
                // Note: we can't easily parse specific fields from summary string, but if we had the object still in scope...
                // Ideally pData scope above. But simplified: Perplexity doesn't usually return numeric followers reliably compared to Apify.
            }
        }
    } else {
        console.log('[ENRICH] No Instagram handle found (even after check), skipping Apify.');
    }

    // ---------------------------------------------------------
    // STEP 3: DATA AGGREGATION & INFERENCE
    // ---------------------------------------------------------

    // Infer location from phone number using libphonenumber-js
    if (!lead.location && lead.phone) {
        try {
            const phoneNumber = parsePhoneNumber(lead.phone);
            if (phoneNumber && phoneNumber.country) {
                const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
                lead.location = regionNames.of(phoneNumber.country);
                console.log(`[ENRICH] Inferred location '${lead.location}' from phone '${lead.phone}'`);
            }
        } catch (e) {
            console.log(`[ENRICH] Could not infer location from phone '${lead.phone}':`, e.message);
        }
    }


    // ---------------------------------------------------------
    // STEP 4: AI TAGGING (Claude) - Combining ALL Intelligence
    // ---------------------------------------------------------
    if (!options.skipAI && process.env.ANTHROPIC_API_KEY) {
        console.log(`[ENRICH] Step 4: Analyzing combined context with AI...`);

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

    // 6. Record Enrichment History
    if (!lead.enrichmentHistory) lead.enrichmentHistory = [];

    lead.enrichmentHistory.unshift({
        timestamp: new Date().toISOString(),
        method: 'Triple Threat (PerplexityFirst -> Apify -> Claude)',
        status: 'Success',
        details: `Generated ${lead.tags?.length || 0} tags, Research: ${researchSummary ? 'Yes' : 'No'}, Metrics: ${metrics && metrics.followers ? 'Yes' : 'No'}`
    });

    // Keep history manageable (last 10 events)
    if (lead.enrichmentHistory.length > 10) {
        lead.enrichmentHistory = lead.enrichmentHistory.slice(0, 10);
    }

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
            // NOTE: In the new "Perplexity First" model, we should attempt enrichment even if no initial instagram handle exists,
            // because Perplexity might find one. So we REMOVE the early skip check.

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
