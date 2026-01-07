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
import { researchLead } from '../perplexity.js'; // Swapped Grok for Perplexity (Sonar Pro)
import { parsePhoneNumber } from 'libphonenumber-js';
import { scanForSocials } from '../scrapers/site-scanner.js';

export async function enrichAndTagLead(lead, options = {}) {
    console.log(`[ENRICH] Starting enrichment for lead ${lead.id}`);

    // Clean slate: Remove existing auto/ai tags
    if (lead.tags) {
        lead.tags = lead.tags.filter(t => t.applied_by === 'manual');
    }

    // ---------------------------------------------------------

    // ---------------------------------------------------------
    // STEP 1: PERPLEXITY (Deep Research) - Always runs first
    // ---------------------------------------------------------
    let researchSummary = '';

    // [NEW] TIER 1: Direct Website Scan
    if (!lead.instagram || !lead.email) {
        if (lead.website) {
            const scannedSocials = await scanForSocials(lead.website);
            if (scannedSocials) {
                if (scannedSocials.instagram && !lead.instagram) {
                    console.log(`[ENRICH] Found Instagram via Site Scan: ${scannedSocials.instagram}`);
                    lead.scraped_instagram = scannedSocials.instagram; // Pass to Perplexity for verification
                    // We DON'T set lead.instagram yet, we let Perplexity confirm it, or we trust it?
                    // Recommendation: Trust it IF it's consistent, but let's just pass it as a hint to Perplexity for now.
                    // Actually, if we trust option 1 is "Direct Website Scan", we should probably trust it high confidence.
                    lead.instagram = scannedSocials.instagram;
                }
                if (scannedSocials.email && !lead.email) {
                    lead.email = scannedSocials.email; // direct mailto is reliable
                }
            }
        }
    }

    if (process.env.PERPLEXITY_API_KEY) {
        console.log(`[ENRICH] Step 1: Starting Perplexity deep research...`);
        try {
            const pData = await researchLead(lead);

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

                    // Map new social fields from the structured contact_info
                    if (pData.contact_info) {
                        const ci = pData.contact_info;
                        if (!lead.website && ci.website && ci.website !== 'N/A') lead.website = ci.website;
                        // Handle full URL or handle
                        if (!lead.instagram && ci.instagram && ci.instagram !== 'N/A') {
                            lead.instagram = ci.instagram;
                        }

                        // Handle Multiple Emails
                        if (ci.emails && Array.isArray(ci.emails) && ci.emails.length > 0) {
                            // Set primary if missing
                            if (!lead.email || lead.email === 'N/A') {
                                lead.email = ci.emails[0];
                            }
                            // Store all emails
                            lead.other_emails = ci.emails;
                        } else if (ci.email && ci.email !== 'N/A') {
                            // Fallback for single email legacy
                            if (!lead.email) lead.email = ci.email;
                            lead.other_emails = [ci.email];
                        }

                        if (ci.phone && ci.phone !== 'N/A') lead.phone = ci.phone;
                        // Store LinkedIn if available (needs schema update but good to catch)
                        if (ci.linkedin && ci.linkedin !== 'N/A') lead.linkedin = ci.linkedin;
                    }

                    // Fallback to top-level if Perplexity flattens it (handled by original logic, but contact_info is preferred)
                    if (!lead.email && pData.email && pData.email !== 'N/A') lead.email = pData.email;

                    // 4. Update core info if better
                    if (pData.category) lead.productCategory = pData.category;
                }

                lead.ai_research_summary = researchSummary;
            }
        } catch (err) {
            console.error('[ENRICH] Grok failed:', err);
            lead.ai_research_summary = `Deep Research Failed: ${err.message}. Check logs.`;
        }
    } else {
        console.warn('⚠️ [ENRICH] No PERPLEXITY_API_KEY found. Skipping deep research.');
        lead.ai_research_summary = "Deep Research Skipped: Missing PERPLEXITY_API_KEY. Please restart the backend server to load the new key.";
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
