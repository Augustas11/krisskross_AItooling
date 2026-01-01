
import { getApifyClient } from './apify-client.js';

export class SocialAnalyzer {
    /**
     * Extracts Instagram handle from a URL or string
     * @param {string} input - URL or handle string
     * @returns {string|null} - Clean handle (no @) or null
     */
    static extractInstagramHandle(input) {
        if (!input) return null;

        // If it's a full URL
        try {
            const urlObj = new URL(input.includes('http') ? input : `https://${input}`);
            if (urlObj.hostname.includes('instagram.com')) {
                const parts = urlObj.pathname.split('/').filter(p => p);
                return parts[0] || null;
            }
        } catch (e) {
            // Not a valid URL, treat as handle
        }

        // Just a handle string (remove @)
        const clean = input.replace(/^@/, '').replace(/\/$/, '').trim();
        return clean.length > 0 ? clean : null;
    }

    /**
     * Fetches details for an Instagram profile using Apify
     * Uses 'apify/instagram-profile-scraper' (cheap/reliable)
     * @param {string} handle 
     * @throws {Error} If the handle is invalid or Apify fails
     */
    static async fetchInstagramMetrics(handle) {
        if (!handle) {
            throw new Error('No handle provided to fetchInstagramMetrics');
        }

        // Validate handle format (basic check)
        const cleanHandle = handle.trim();
        if (cleanHandle.length === 0) {
            throw new Error('Handle is empty after trimming');
        }

        const client = getApifyClient();
        console.log(`🔍 [SocialAnalyzer] Fetching metrics for handle: "${cleanHandle}"`);

        // Check token availability
        if (!process.env.APIFY_API_TOKEN) {
            const error = 'Missing APIFY_API_TOKEN in environment variables';
            console.error(`❌ [SocialAnalyzer] ${error}`);
            throw new Error(error);
        } else {
            console.log(`🔑 [SocialAnalyzer] Token present, length: ${process.env.APIFY_API_TOKEN.length}`);
        }

        try {
            console.log(`📞 [SocialAnalyzer] Calling Apify actor 'apify/instagram-profile-scraper' with username: "${cleanHandle}"`);

            // Run the Actor and wait for it to finish
            const run = await client.actor('apify/instagram-profile-scraper').call({
                usernames: [cleanHandle],
                proxy: { useApifyProxy: true }
            });

            console.log(`✅ [SocialAnalyzer] Apify run finished successfully`);
            console.log(`   Run ID: ${run.id}`);
            console.log(`   Status: ${run.status}`);
            console.log(`   Dataset ID: ${run.defaultDatasetId}`);

            // Fetch results from the dataset
            const { items } = await client.dataset(run.defaultDatasetId).listItems();
            console.log(`📦 [SocialAnalyzer] Dataset returned ${items ? items.length : 0} items`);

            if (!items || items.length === 0) {
                const error = `Instagram profile not found or private: @${cleanHandle}. The account may not exist, be private, or be temporarily unavailable.`;
                console.warn(`⚠️ [SocialAnalyzer] ${error}`);
                throw new Error(error);
            }

            const profile = items[0];

            // Validate profile data
            if (!profile.followersCount && profile.followersCount !== 0) {
                console.warn(`⚠️ [SocialAnalyzer] Profile data incomplete for ${cleanHandle}:`, profile);
                throw new Error(`Incomplete profile data returned for @${cleanHandle}. The profile may be restricted or the scraper encountered an issue.`);
            }

            console.log(`✅ [SocialAnalyzer] Successfully fetched profile for @${cleanHandle}`);
            console.log(`   Followers: ${profile.followersCount}`);
            console.log(`   Posts: ${profile.postsCount}`);
            console.log(`   Latest posts available: ${profile.latestPosts ? profile.latestPosts.length : 0}`);

            // Calculate engagement (if posts available)
            let engagementRate = 0;
            if (profile.latestPosts && profile.latestPosts.length > 0) {
                const totalInteractions = profile.latestPosts.reduce((acc, post) =>
                    acc + (post.likesCount || 0) + (post.commentsCount || 0), 0);
                const avgInteractions = totalInteractions / profile.latestPosts.length;
                engagementRate = (avgInteractions / profile.followersCount) * 100;
            }

            return {
                followers: profile.followersCount,
                following: profile.followsCount,
                posts: profile.postsCount,
                isBusiness: profile.isBusinessAccount,
                biography: profile.biography,
                engagementRate: parseFloat(engagementRate.toFixed(2)),
                avgLikes: profile.latestPosts ?
                    Math.round(profile.latestPosts.reduce((acc, p) => acc + (p.likesCount || 0), 0) / profile.latestPosts.length) : 0
            };

        } catch (error) {
            // Log the full error for debugging
            console.error(`❌ [SocialAnalyzer] Error fetching metrics for @${cleanHandle}:`);
            console.error(`   Error type: ${error.constructor.name}`);
            console.error(`   Error message: ${error.message}`);
            if (error.stack) {
                console.error(`   Stack trace: ${error.stack}`);
            }

            // Re-throw with context instead of returning null
            // This preserves the error chain and allows proper error handling upstream
            throw new Error(`Failed to fetch Instagram metrics for @${cleanHandle}: ${error.message}`);
        }
    }
}
