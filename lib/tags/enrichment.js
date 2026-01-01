/**
 * Lead Enrichment with Apify + AI Tagging
 * Integrates existing SocialAnalyzer with auto-tagging engine
 */

import { SocialAnalyzer } from '../social-analyzer.js';
import { analyzeCaptionsForPainPoints, analyzeBusinessType } from './ai-analyzer.js';
import { autoTagLead } from './auto-tagger.js';
import { addTag, removeTagsByCategory } from './utils.js';
import { calculatePostingFrequency } from './auto-tagger.js';

/**
 * Enrich a lead with Instagram data and apply AI-powered tags
 * @param {object} lead - Lead object to enrich
 * @param {object} options - Enrichment options
 * @returns {object} Enriched and tagged lead
 */
export async function enrichAndTagLead(lead, options = {}) {
    console.log(`[ENRICH] Starting enrichment for lead ${lead.id}`);

    // Extract Instagram handle
    let handle = null;
    if (lead.instagram && lead.instagram !== 'N/A') {
        handle = SocialAnalyzer.extractInstagramHandle(lead.instagram);
    }

    if (!handle) {
        console.warn(`[ENRICH] No Instagram handle found for lead ${lead.id}`);
        // Still run basic auto-tagging without Instagram data
        await autoTagLead(lead);
        return lead;
    }

    try {
        // Fetch Instagram metrics using existing Apify integration
        console.log(`[ENRICH] Fetching Instagram metrics for @${handle}...`);
        const metrics = await SocialAnalyzer.fetchInstagramMetrics(handle);

        console.log(`[ENRICH] Successfully fetched metrics for @${handle}`);
        console.log(`  Followers: ${metrics.followers}`);
        console.log(`  Engagement: ${metrics.engagementRate}%`);
        console.log(`  Posts: ${metrics.posts}`);

        // Update lead with Instagram metrics
        lead.instagramFollowers = metrics.followers;
        lead.engagementRate = metrics.engagementRate;
        lead.instagram = handle; // Normalize handle

        // Calculate posting frequency if we have post count
        // Note: This is a rough estimate - ideally we'd track posts over time
        if (metrics.posts) {
            // Assume account is ~1 year old (rough estimate)
            // Better: Store first_seen_at and calculate from there
            const estimatedWeeks = 52;
            const postsPerWeek = metrics.posts / estimatedWeeks;
            lead.posting_frequency = calculatePostingFrequency(postsPerWeek * 4.3); // Convert to posts per month
        }

        // AI Caption Analysis (if enabled and API key available)
        if (!options.skipAI && process.env.ANTHROPIC_API_KEY) {
            console.log(`[ENRICH] Analyzing captions with AI...`);

            // Get latest posts from metrics (Apify returns latestPosts)
            const latestPosts = metrics.latestPosts || [];

            if (latestPosts.length > 0) {
                const painPoints = await analyzeCaptionsForPainPoints(latestPosts);

                // Add AI-detected pain point tags
                painPoints.forEach(painPoint => {
                    addTag(lead, painPoint.full_tag, {
                        applied_by: 'ai',
                        confidence: painPoint.confidence,
                        evidence: painPoint.evidence
                    });
                });

                console.log(`[ENRICH] Added ${painPoints.length} AI-detected pain point tags`);
            }
        }

        // Analyze bio for business type (if not already tagged)
        if (metrics.biography) {
            const businessTag = analyzeBusinessType(metrics.biography);
            if (businessTag) {
                // Remove existing business tags and add new one
                removeTagsByCategory(lead, 'business');
                addTag(lead, businessTag, { applied_by: 'auto' });
                console.log(`[ENRICH] Detected business type from bio: ${businessTag}`);
            }
        }

        // Run full auto-tagging with the new data
        console.log(`[ENRICH] Running auto-tagger for @${handle}...`);
        await autoTagLead(lead);

        // Mark as enriched
        lead.enriched = true;
        lead.lastEnrichedAt = new Date().toISOString();

        console.log(`[ENRICH] Enrichment complete for lead ${lead.id}`);
        console.log(`  Final Tags: ${lead.tags?.map(t => typeof t === 'object' ? t.full_tag : t).join(', ')}`);
        console.log(`  Tier: ${lead.tier}`);
        console.log(`  Score: ${lead.score}`);

        return lead;

    } catch (error) {
        console.error(`[ENRICH] Error enriching lead ${lead.id}:`, error);

        // Still run basic auto-tagging even if enrichment fails
        await autoTagLead(lead);

        // Don't throw - return partially enriched lead
        return lead;
    }
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
