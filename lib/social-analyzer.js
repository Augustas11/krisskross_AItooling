
import { getApifyClient } from './apify-client';

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
     */
    static async fetchInstagramMetrics(handle) {
        if (!handle) throw new Error('No handle provided');

        const client = getApifyClient();
        console.log(`🔍 [SocialAnalyzer] Fetching metrics for ${handle}...`);

        if (!process.env.APIFY_API_TOKEN) {
            console.error('❌ [SocialAnalyzer] Missing APIFY_API_TOKEN in process.env');
        } else {
            console.log(`🔑 [SocialAnalyzer] Token present, length: ${process.env.APIFY_API_TOKEN.length}`);
        }

        try {
            // Run the Actor and wait for it to finish
            const run = await client.actor('apify/instagram-profile-scraper').call({
                usernames: [handle],
                proxy: { useApifyProxy: true }
            });

            console.log(`✅ [SocialAnalyzer] Apify run finished: ${run.id}`);

            // Fetch results from the dataset
            const { items } = await client.dataset(run.defaultDatasetId).listItems();

            if (!items || items.length === 0) {
                console.warn(`⚠️ [SocialAnalyzer] No items returned for ${handle}`);
                return null;
            }

            const profile = items[0];

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
            console.error('❌ [SocialAnalyzer] Apify error:', error);
            // Return null so we don't crash everything
            return null;
        }
    }
}
