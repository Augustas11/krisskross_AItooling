/**
 * Auto-Tagging Engine
 * Automatically applies tags to leads based on data extraction rules
 */

import {
    addTag,
    removeTagsByCategory,
    setTagInCategory,
    hasTag
} from './utils.js';

/**
 * Main auto-tagging function - runs all tagging stages
 * @param {object} lead - Lead object to tag
 * @param {object} options - Tagging options (skipAI, skipComposite, etc.)
 * @returns {object} Tagged lead object
 */
export async function autoTagLead(lead, options = {}) {
    console.log(`[AUTO-TAG] Starting auto-tagging for lead ${lead.id}`);

    // Stage 1: Basic data extraction tags
    applyBasicTags(lead);

    // Stage 2: Platform detection
    applyPlatformTags(lead);

    // Stage 3: Follower and engagement tags (if data available)
    applyAudienceTags(lead);

    // Stage 4: Posting frequency tags (if data available)
    applyPostingFrequencyTags(lead);

    // Stage 5: Composite rules (ICP matching) - unless skipped
    if (!options.skipComposite) {
        applyCompositeTags(lead);
    }

    // Stage 6: Priority tier assignment based on score
    applyPriorityTier(lead);

    // Update last tagged timestamp
    lead.last_tagged_at = new Date().toISOString();

    console.log(`[AUTO-TAG] Completed auto-tagging for lead ${lead.id} - ${lead.tags?.length || 0} tags applied`);

    return lead;
}

/**
 * Stage 1: Basic Data Extraction Tags
 * Tags based on simple field values (phone, bio keywords)
 */
export function applyBasicTags(lead) {
    // Geography from phone number
    if (lead.phone) {
        const phone = lead.phone.replace(/\s/g, ''); // Remove spaces

        if (phone.startsWith('+1')) {
            // Could be US or Canada - default to US
            addTag(lead, 'geo:US', { applied_by: 'auto' });
        } else if (phone.startsWith('+886')) {
            addTag(lead, 'geo:Taiwan', { applied_by: 'auto' });
        } else if (phone.startsWith('+84')) {
            addTag(lead, 'geo:Vietnam', { applied_by: 'auto' });
        } else if (phone.startsWith('+44')) {
            addTag(lead, 'geo:UK', { applied_by: 'auto' });
        } else if (phone.startsWith('+65')) {
            addTag(lead, 'geo:Singapore', { applied_by: 'auto' });
        } else {
            addTag(lead, 'geo:other', { applied_by: 'auto' });
        }
    }

    // Business type from Instagram bio or product category
    // ONLY apply valid basic tag if no AI/Manual tag exists for this category
    const hasExistingBusinessTag = lead.tags && lead.tags.some(t => t.category === 'business' && (t.applied_by === 'ai' || t.applied_by === 'manual'));

    if (!hasExistingBusinessTag) {
        const bioText = (lead.briefDescription || lead.productCategory || '').toLowerCase();

        if (bioText.match(/fashion|clothing|apparel|boutique|wear/i)) {
            addTag(lead, 'business:fashion', { applied_by: 'auto' });
        } else if (bioText.match(/jewelry|accessories|bags|watches|hats/i)) {
            addTag(lead, 'business:accessories', { applied_by: 'auto' });
        } else if (bioText.match(/beauty|cosmetics|skincare|makeup/i)) {
            addTag(lead, 'business:beauty', { applied_by: 'auto' });
        } else if (bioText.match(/shoes|footwear|sneakers|boots/i)) {
            addTag(lead, 'business:shoes', { applied_by: 'auto' });
        } else if (bioText.match(/home|decor|furniture|interior/i)) {
            addTag(lead, 'business:home', { applied_by: 'auto' });
        } else if (bioText.match(/tech|electronics|gadgets|devices/i)) {
            addTag(lead, 'business:electronics', { applied_by: 'auto' });
        } else {
            addTag(lead, 'business:other', { applied_by: 'auto' });
        }
    }

    return lead;
}

/**
 * Stage 2: Platform Detection
 * Detect e-commerce platforms from website URLs and bio links
 */
export function applyPlatformTags(lead) {
    const website = (lead.website || lead.storeUrl || '').toLowerCase();
    const instagram = (lead.instagram || '').toLowerCase();

    // TikTok Shop
    if (instagram.includes('tiktok.com/@') || lead.tiktok) {
        addTag(lead, 'platform:tiktok_shop', { applied_by: 'auto' });
    }

    // Instagram Shop (if has Instagram handle, assume they might have shopping)
    if (lead.instagram && lead.instagram !== 'N/A') {
        addTag(lead, 'platform:instagram_shop', { applied_by: 'auto' });
    }

    // Shopify
    if (website.includes('shopify') || website.includes('.myshopify.com')) {
        addTag(lead, 'platform:shopify', { applied_by: 'auto' });
    }

    // Amazon
    if (website.includes('amazon.com') || instagram.includes('amazon')) {
        addTag(lead, 'platform:amazon', { applied_by: 'auto' });
    }

    // Etsy
    if (website.includes('etsy.com/shop')) {
        addTag(lead, 'platform:etsy', { applied_by: 'auto' });
    }

    return lead;
}

/**
 * Stage 3: Audience Tags
 * Apply follower range and engagement rate tags based on Instagram data
 */
export function applyAudienceTags(lead) {
    // Follower range
    if (lead.instagramFollowers !== null && lead.instagramFollowers !== undefined) {
        const followers = lead.instagramFollowers;

        // Remove existing follower tags
        removeTagsByCategory(lead, 'followers');

        if (followers < 1000) {
            addTag(lead, 'followers:<1k', { applied_by: 'auto' });
        } else if (followers < 5000) {
            addTag(lead, 'followers:1k-5k', { applied_by: 'auto' });
        } else if (followers < 10000) {
            addTag(lead, 'followers:5k-10k', { applied_by: 'auto' });
        } else if (followers < 100000) {
            addTag(lead, 'followers:10k-100k', { applied_by: 'auto' });
        } else if (followers < 500000) {
            addTag(lead, 'followers:100k-500k', { applied_by: 'auto' });
        } else {
            addTag(lead, 'followers:500k+', { applied_by: 'auto' });
        }
    }

    // Engagement rate
    if (lead.engagementRate !== null && lead.engagementRate !== undefined) {
        const engagement = lead.engagementRate;

        // Remove existing engagement tags
        removeTagsByCategory(lead, 'engagement');

        if (engagement < 1) {
            addTag(lead, 'engagement:low', { applied_by: 'auto' });
        } else if (engagement < 2) {
            addTag(lead, 'engagement:medium', { applied_by: 'auto' });
        } else {
            addTag(lead, 'engagement:high', { applied_by: 'auto' });
        }
    }

    return lead;
}

/**
 * Stage 4: Posting Frequency Tags
 * Calculate posting frequency from recent posts data
 */
export function applyPostingFrequencyTags(lead) {
    if (lead.posting_frequency) {
        // Skip if AI already set a posting tag
        if (lead.tags && lead.tags.some(t => t.category === 'posting' && t.applied_by === 'ai')) {
            return lead;
        }

        // Remove existing posting tags (only auto ones essentially, as per logic above)
        removeTagsByCategory(lead, 'posting');

        const freq = lead.posting_frequency;

        if (freq === 'low') {
            addTag(lead, 'posting:low', { applied_by: 'auto' });
        } else if (freq === 'ideal') {
            addTag(lead, 'posting:ideal', { applied_by: 'auto' });
        } else if (freq === 'high') {
            addTag(lead, 'posting:high', { applied_by: 'auto' });
        } else if (freq === 'power_user') {
            addTag(lead, 'posting:power_user', { applied_by: 'auto' });
        }
    }

    return lead;
}

/**
 * Stage 5: Composite Tags (ICP Matching)
 * Apply ICP tags based on combinations of other tags
 */
export function applyCompositeTags(lead) {
    // Remove existing ICP tags
    removeTagsByCategory(lead, 'icp');

    // User2 Profile (IDEAL CUSTOMER)
    // Fashion/Accessories + 10k-100k followers + US/Taiwan + Ideal posting + Pain point
    const isUser2 = (
        (hasTag(lead, 'business:fashion') || hasTag(lead, 'business:accessories')) &&
        hasTag(lead, 'followers:10k-100k') &&
        (hasTag(lead, 'geo:US') || hasTag(lead, 'geo:Taiwan')) &&
        hasTag(lead, 'posting:ideal') &&
        (hasTag(lead, 'pain:manual_video') || hasTag(lead, 'pain:low_diversity'))
    );

    if (isUser2) {
        addTag(lead, 'icp:user2_profile', { applied_by: 'auto' });
        // Boost score
        lead.score = (lead.score || 0) + 30;
        console.log(`[AUTO-TAG] Lead ${lead.id} matches User2 Profile (IDEAL) - score boosted`);
        return lead;
    }

    // User3 Profile (POWER USER - AVOID)
    // Power user posting + Professional content
    const isUser3 = (
        hasTag(lead, 'posting:power_user') &&
        hasTag(lead, 'content:professional')
    );

    if (isUser3) {
        addTag(lead, 'icp:user3_profile', { applied_by: 'auto' });
        // Penalize score and force RED tier
        lead.score = Math.max(0, (lead.score || 0) - 50);
        lead.tier = 'RED';
        console.log(`[AUTO-TAG] Lead ${lead.id} matches User3 Profile (AVOID) - score penalized`);
        return lead;
    }

    // User1 Profile (AI TOOL REVIEWER - AVOID)
    // Business:other + mentions AI tools in bio
    const bioText = (lead.briefDescription || lead.productCategory || '').toLowerCase();
    const isUser1 = (
        hasTag(lead, 'business:other') &&
        bioText.match(/ai tools?|tech review|software review/i)
    );

    if (isUser1) {
        addTag(lead, 'icp:user1_profile', { applied_by: 'auto' });
        // Penalize score
        lead.score = Math.max(0, (lead.score || 0) - 40);
        console.log(`[AUTO-TAG] Lead ${lead.id} matches User1 Profile (AVOID) - score penalized`);
        return lead;
    }

    // Default: Neutral
    addTag(lead, 'icp:neutral', { applied_by: 'auto' });

    return lead;
}

/**
 * Stage 6: Priority Tier Assignment
 * Assign priority tier based on calculated score
 */
export function applyPriorityTier(lead) {
    const score = lead.score || 0;

    // Remove existing priority tags
    removeTagsByCategory(lead, 'priority');

    if (score >= 70) {
        setTagInCategory(lead, 'priority:🟢GREEN', { applied_by: 'auto' });
        lead.tier = 'GREEN';
    } else if (score >= 40) {
        setTagInCategory(lead, 'priority:🟡YELLOW', { applied_by: 'auto' });
        lead.tier = 'YELLOW';
    } else {
        setTagInCategory(lead, 'priority:🔴RED', { applied_by: 'auto' });
        lead.tier = 'RED';
    }

    return lead;
}

/**
 * Calculate posting frequency from posts count
 * @param {number} postsLast30Days - Number of posts in last 30 days
 * @returns {string} Frequency category: low, ideal, high, power_user
 */
export function calculatePostingFrequency(postsLast30Days) {
    const postsPerWeek = postsLast30Days / 4.3; // Average weeks in a month

    if (postsPerWeek < 1) {
        return 'low';
    } else if (postsPerWeek >= 2 && postsPerWeek <= 5) {
        return 'ideal';
    } else if (postsPerWeek >= 6 && postsPerWeek <= 10) {
        return 'high';
    } else if (postsPerWeek >= 20) {
        return 'power_user';
    }

    return 'low'; // Default
}

/**
 * Re-tag a lead (remove all auto tags and re-apply)
 * @param {object} lead - Lead object
 * @param {object} options - Tagging options
 * @returns {object} Re-tagged lead
 */
export async function retagLead(lead, options = {}) {
    console.log(`[AUTO-TAG] Re-tagging lead ${lead.id}`);

    // Remove all auto-applied tags (keep manual and AI tags)
    if (lead.tags) {
        lead.tags = lead.tags.filter(tag => tag.applied_by !== 'auto');
    }

    // Re-run auto-tagging
    return await autoTagLead(lead, options);
}

/**
 * Batch auto-tag multiple leads
 * @param {array} leads - Array of lead objects
 * @param {object} options - Tagging options
 * @returns {array} Tagged leads
 */
export async function batchAutoTag(leads, options = {}) {
    console.log(`[AUTO-TAG] Batch tagging ${leads.length} leads`);

    const taggedLeads = [];

    for (const lead of leads) {
        try {
            const tagged = await autoTagLead(lead, options);
            taggedLeads.push(tagged);
        } catch (error) {
            console.error(`[AUTO-TAG] Error tagging lead ${lead.id}:`, error);
            taggedLeads.push(lead); // Include untagged lead
        }
    }

    console.log(`[AUTO-TAG] Batch tagging complete - ${taggedLeads.length} leads processed`);

    return taggedLeads;
}
