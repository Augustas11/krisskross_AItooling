/**
 * Tag System Definitions
 * Central registry of all 50+ tag categories and their metadata
 */

export const TAG_CATEGORIES = {
    BUSINESS: 'business',
    GEO: 'geo',
    PLATFORM: 'platform',
    FOLLOWERS: 'followers',
    ENGAGEMENT: 'engagement',
    PAIN: 'pain',
    CONTENT: 'content',
    POSTING: 'posting',
    ICP: 'icp',
    PRIORITY: 'priority',
    STATUS: 'status',
    OUTREACH: 'outreach',
    PRODUCTS: 'products',
    REVENUE: 'revenue',
    SPECIAL: 'special'
};

/**
 * Complete tag definitions with metadata for UI display and validation
 */
export const TAG_DEFINITIONS = {
    // ============================================
    // BUSINESS TYPE (business:*)
    // ============================================
    'business:fashion': {
        category: 'business',
        name: 'fashion',
        label: 'Fashion',
        description: 'Clothing, apparel',
        color: '#FF6B9D',
        keywords: ['fashion', 'clothing', 'apparel', 'boutique', 'wear']
    },
    'business:accessories': {
        category: 'business',
        name: 'accessories',
        label: 'Accessories',
        description: 'Jewelry, bags, hats',
        color: '#C44569',
        keywords: ['jewelry', 'accessories', 'bags', 'watches', 'hats']
    },
    'business:beauty': {
        category: 'business',
        name: 'beauty',
        label: 'Beauty',
        description: 'Cosmetics, skincare',
        color: '#F8B500',
        keywords: ['beauty', 'cosmetics', 'skincare', 'makeup']
    },
    'business:shoes': {
        category: 'business',
        name: 'shoes',
        label: 'Shoes',
        description: 'Footwear',
        color: '#A8E6CF',
        keywords: ['shoes', 'footwear', 'sneakers', 'boots']
    },
    'business:home': {
        category: 'business',
        name: 'home',
        label: 'Home',
        description: 'Home decor, furniture',
        color: '#FFD3B6',
        keywords: ['home', 'decor', 'furniture', 'interior']
    },
    'business:electronics': {
        category: 'business',
        name: 'electronics',
        label: 'Electronics',
        description: 'Gadgets, tech',
        color: '#FFAAA5',
        keywords: ['tech', 'electronics', 'gadgets', 'devices']
    },
    'business:other': {
        category: 'business',
        name: 'other',
        label: 'Other',
        description: 'Miscellaneous',
        color: '#B8B8B8',
        keywords: []
    },

    // ============================================
    // GEOGRAPHY (geo:*)
    // ============================================
    'geo:US': {
        category: 'geo',
        name: 'US',
        label: 'United States',
        description: 'US-based seller',
        color: '#3B82F6',
        phonePrefix: '+1'
    },
    'geo:Taiwan': {
        category: 'geo',
        name: 'Taiwan',
        label: 'Taiwan',
        description: 'Taiwan-based seller',
        color: '#10B981',
        phonePrefix: '+886'
    },
    'geo:Vietnam': {
        category: 'geo',
        name: 'Vietnam',
        label: 'Vietnam',
        description: 'Vietnam-based seller',
        color: '#F59E0B',
        phonePrefix: '+84'
    },
    'geo:UK': {
        category: 'geo',
        name: 'UK',
        label: 'United Kingdom',
        description: 'UK-based seller',
        color: '#8B5CF6',
        phonePrefix: '+44'
    },
    'geo:Canada': {
        category: 'geo',
        name: 'Canada',
        label: 'Canada',
        description: 'Canada-based seller',
        color: '#EC4899',
        phonePrefix: '+1'
    },
    'geo:Singapore': {
        category: 'geo',
        name: 'Singapore',
        label: 'Singapore',
        description: 'Singapore-based seller',
        color: '#14B8A6',
        phonePrefix: '+65'
    },
    'geo:other': {
        category: 'geo',
        name: 'other',
        label: 'Other',
        description: 'Other country',
        color: '#6B7280',
        phonePrefix: null
    },

    // ============================================
    // PLATFORM (platform:*)
    // ============================================
    'platform:tiktok_shop': {
        category: 'platform',
        name: 'tiktok_shop',
        label: 'TikTok Shop',
        description: 'Active TikTok Shop seller',
        color: '#000000',
        icon: '📱'
    },
    'platform:instagram_shop': {
        category: 'platform',
        name: 'instagram_shop',
        label: 'Instagram Shop',
        description: 'Instagram Shopping enabled',
        color: '#E4405F',
        icon: '📸'
    },
    'platform:shopify': {
        category: 'platform',
        name: 'shopify',
        label: 'Shopify',
        description: 'Has Shopify store',
        color: '#96BF48',
        icon: '🛍️'
    },
    'platform:amazon': {
        category: 'platform',
        name: 'amazon',
        label: 'Amazon',
        description: 'Sells on Amazon',
        color: '#FF9900',
        icon: '📦'
    },
    'platform:etsy': {
        category: 'platform',
        name: 'etsy',
        label: 'Etsy',
        description: 'Sells on Etsy',
        color: '#F56400',
        icon: '🎨'
    },
    'platform:other': {
        category: 'platform',
        name: 'other',
        label: 'Other',
        description: 'Other platforms',
        color: '#9CA3AF',
        icon: '🌐'
    },

    // ============================================
    // FOLLOWER RANGE (followers:*)
    // ============================================
    'followers:<1k': {
        category: 'followers',
        name: '<1k',
        label: '<1k',
        description: 'Hobbyist, too small',
        color: '#EF4444',
        min: 0,
        max: 999,
        icpFit: 'poor'
    },
    'followers:1k-5k': {
        category: 'followers',
        name: '1k-5k',
        label: '1k-5k',
        description: 'Growing but small',
        color: '#F59E0B',
        min: 1000,
        max: 4999,
        icpFit: 'fair'
    },
    'followers:5k-10k': {
        category: 'followers',
        name: '5k-10k',
        label: '5k-10k',
        description: 'Decent size',
        color: '#10B981',
        min: 5000,
        max: 9999,
        icpFit: 'good'
    },
    'followers:10k-100k': {
        category: 'followers',
        name: '10k-100k',
        label: '10k-100k',
        description: 'IDEAL RANGE',
        color: '#22C55E',
        min: 10000,
        max: 99999,
        icpFit: 'ideal'
    },
    'followers:100k-500k': {
        category: 'followers',
        name: '100k-500k',
        label: '100k-500k',
        description: 'Large, might have team',
        color: '#3B82F6',
        min: 100000,
        max: 499999,
        icpFit: 'fair'
    },
    'followers:500k+': {
        category: 'followers',
        name: '500k+',
        label: '500k+',
        description: 'Influencer, not target',
        color: '#8B5CF6',
        min: 500000,
        max: Infinity,
        icpFit: 'poor'
    },

    // ============================================
    // ENGAGEMENT RATE (engagement:*)
    // ============================================
    'engagement:low': {
        category: 'engagement',
        name: 'low',
        label: 'Low (<1%)',
        description: 'Likely bought followers',
        color: '#EF4444',
        min: 0,
        max: 0.99
    },
    'engagement:medium': {
        category: 'engagement',
        name: 'medium',
        label: 'Medium (1-2%)',
        description: 'Average engagement',
        color: '#F59E0B',
        min: 1,
        max: 1.99
    },
    'engagement:high': {
        category: 'engagement',
        name: 'high',
        label: 'High (>2%)',
        description: 'Real, engaged audience',
        color: '#10B981',
        min: 2,
        max: Infinity
    },

    // ============================================
    // PAIN POINTS (pain:*)
    // ============================================
    'pain:manual_video': {
        category: 'pain',
        name: 'manual_video',
        label: 'Manual Video Creation',
        description: 'Creates videos manually',
        color: '#DC2626',
        icon: '🎬',
        priority: 'high'
    },
    'pain:low_diversity': {
        category: 'pain',
        name: 'low_diversity',
        label: 'Low Model Diversity',
        description: 'Always uses same model',
        color: '#EA580C',
        icon: '👤',
        priority: 'high'
    },
    'pain:slow_editing': {
        category: 'pain',
        name: 'slow_editing',
        label: 'Slow Editing',
        description: 'Mentions time spent editing',
        color: '#D97706',
        icon: '⏱️',
        priority: 'medium'
    },
    'pain:uses_freelancers': {
        category: 'pain',
        name: 'uses_freelancers',
        label: 'Uses Freelancers',
        description: 'Pays others for production',
        color: '#CA8A04',
        icon: '💰',
        priority: 'medium'
    },
    'pain:low_quality': {
        category: 'pain',
        name: 'low_quality',
        label: 'Low Quality Videos',
        description: 'Uses static images or poor videos',
        color: '#EAB308',
        icon: '📉',
        priority: 'low'
    },
    'pain:no_models': {
        category: 'pain',
        name: 'no_models',
        label: 'No Models',
        description: 'Only product shots, no people',
        color: '#FACC15',
        icon: '📦',
        priority: 'low'
    },

    // ============================================
    // CONTENT STYLE (content:*)
    // ============================================
    'content:selfie': {
        category: 'content',
        name: 'selfie',
        label: 'Selfie Style',
        description: 'Selfie-style UGC videos',
        color: '#EC4899'
    },
    'content:static': {
        category: 'content',
        name: 'static',
        label: 'Static Images',
        description: 'Static product images, no video',
        color: '#6B7280'
    },
    'content:ugc': {
        category: 'content',
        name: 'ugc',
        label: 'UGC',
        description: 'User-generated content style',
        color: '#8B5CF6'
    },
    'content:professional': {
        category: 'content',
        name: 'professional',
        label: 'Professional',
        description: 'Professional studio production',
        color: '#3B82F6'
    },
    'content:mixed': {
        category: 'content',
        name: 'mixed',
        label: 'Mixed',
        description: 'Combination of styles',
        color: '#10B981'
    },

    // ============================================
    // POSTING FREQUENCY (posting:*)
    // ============================================
    'posting:low': {
        category: 'posting',
        name: 'low',
        label: 'Low (<1/week)',
        description: 'Inconsistent posting',
        color: '#EF4444',
        postsPerWeek: { min: 0, max: 0.99 }
    },
    'posting:ideal': {
        category: 'posting',
        name: 'ideal',
        label: 'Ideal (2-5/week)',
        description: 'PERFECT FOR US',
        color: '#22C55E',
        postsPerWeek: { min: 2, max: 5 }
    },
    'posting:high': {
        category: 'posting',
        name: 'high',
        label: 'High (6-10/week)',
        description: 'High volume',
        color: '#3B82F6',
        postsPerWeek: { min: 6, max: 10 }
    },
    'posting:power_user': {
        category: 'posting',
        name: 'power_user',
        label: 'Power User (20+/week)',
        description: 'AVOID - Won\'t pay',
        color: '#DC2626',
        postsPerWeek: { min: 20, max: Infinity }
    },

    // ============================================
    // ICP MATCH (icp:*)
    // ============================================
    'icp:user2_profile': {
        category: 'icp',
        name: 'user2_profile',
        label: 'User2 Profile (IDEAL)',
        description: 'Fashion seller, quality-focused, ideal posting',
        color: '#22C55E',
        icon: '🎯',
        scoreBoost: 30
    },
    'icp:user3_profile': {
        category: 'icp',
        name: 'user3_profile',
        label: 'User3 Profile (AVOID)',
        description: 'Power user with optimized workflow',
        color: '#DC2626',
        icon: '⚠️',
        scoreBoost: -50
    },
    'icp:user1_profile': {
        category: 'icp',
        name: 'user1_profile',
        label: 'User1 Profile (AVOID)',
        description: 'AI tool reviewer, won\'t pay',
        color: '#EF4444',
        icon: '❌',
        scoreBoost: -40
    },
    'icp:neutral': {
        category: 'icp',
        name: 'neutral',
        label: 'Neutral',
        description: 'Doesn\'t match any profile',
        color: '#6B7280',
        icon: '⚪',
        scoreBoost: 0
    },

    // ============================================
    // PRIORITY TIER (priority:*)
    // ============================================
    'priority:🟢GREEN': {
        category: 'priority',
        name: '🟢GREEN',
        label: 'GREEN',
        description: 'Score 80-100, contact within 24 hours',
        color: '#22C55E',
        icon: '🟢',
        scoreMin: 80,
        scoreMax: 100
    },
    'priority:🟡YELLOW': {
        category: 'priority',
        name: '🟡YELLOW',
        label: 'YELLOW',
        description: 'Score 50-79, contact within 1 week',
        color: '#EAB308',
        icon: '🟡',
        scoreMin: 50,
        scoreMax: 79
    },
    'priority:🔴RED': {
        category: 'priority',
        name: '🔴RED',
        label: 'RED',
        description: 'Score 0-49, batch contact or ignore',
        color: '#DC2626',
        icon: '🔴',
        scoreMin: 0,
        scoreMax: 49
    },

    // ============================================
    // LEAD STATUS (status:*)
    // ============================================
    'status:discovered': {
        category: 'status',
        name: 'discovered',
        label: 'Discovered',
        description: 'Just added to CRM',
        color: '#3B82F6'
    },
    'status:enriched': {
        category: 'status',
        name: 'enriched',
        label: 'Enriched',
        description: 'Data pulled, tags applied',
        color: '#8B5CF6'
    },
    'status:contacted': {
        category: 'status',
        name: 'contacted',
        label: 'Contacted',
        description: 'First email sent',
        color: '#EC4899'
    },
    'status:opened': {
        category: 'status',
        name: 'opened',
        label: 'Opened',
        description: 'Email opened',
        color: '#F59E0B'
    },
    'status:replied': {
        category: 'status',
        name: 'replied',
        label: 'Replied',
        description: 'They responded',
        color: '#10B981'
    },
    'status:demo_booked': {
        category: 'status',
        name: 'demo_booked',
        label: 'Demo Booked',
        description: 'Scheduled call/demo',
        color: '#22C55E'
    },
    'status:trial_started': {
        category: 'status',
        name: 'trial_started',
        label: 'Trial Started',
        description: 'Using free trial',
        color: '#14B8A6'
    },
    'status:converted': {
        category: 'status',
        name: 'converted',
        label: 'Converted',
        description: 'Paying customer',
        color: '#059669'
    },
    'status:churned': {
        category: 'status',
        name: 'churned',
        label: 'Churned',
        description: 'Cancelled subscription',
        color: '#DC2626'
    },
    'status:ignored': {
        category: 'status',
        name: 'ignored',
        label: 'Ignored',
        description: 'Chose not to contact',
        color: '#6B7280'
    },

    // ============================================
    // OUTREACH HISTORY (outreach:*)
    // ============================================
    'outreach:email_1_sent': {
        category: 'outreach',
        name: 'email_1_sent',
        label: 'Email 1 Sent',
        description: 'First email sent',
        color: '#3B82F6'
    },
    'outreach:email_1_opened': {
        category: 'outreach',
        name: 'email_1_opened',
        label: 'Email 1 Opened',
        description: 'First email opened',
        color: '#8B5CF6'
    },
    'outreach:email_2_sent': {
        category: 'outreach',
        name: 'email_2_sent',
        label: 'Email 2 Sent',
        description: 'Follow-up sent',
        color: '#EC4899'
    },
    'outreach:no_response': {
        category: 'outreach',
        name: 'no_response',
        label: 'No Response',
        description: 'Sent 2+ emails, no reply',
        color: '#EF4444'
    },
    'outreach:unsubscribed': {
        category: 'outreach',
        name: 'unsubscribed',
        label: 'Unsubscribed',
        description: 'Opted out',
        color: '#DC2626'
    },

    // ============================================
    // PRODUCT VOLUME (products:*)
    // ============================================
    'products:<10': {
        category: 'products',
        name: '<10',
        label: '<10 SKUs',
        description: 'Very small catalog',
        color: '#EF4444',
        min: 0,
        max: 9
    },
    'products:10-50': {
        category: 'products',
        name: '10-50',
        label: '10-50 SKUs',
        description: 'Good range',
        color: '#10B981',
        min: 10,
        max: 50
    },
    'products:50-100': {
        category: 'products',
        name: '50-100',
        label: '50-100 SKUs',
        description: 'IDEAL - Needs automation',
        color: '#22C55E',
        min: 50,
        max: 100
    },
    'products:100-500': {
        category: 'products',
        name: '100-500',
        label: '100-500 SKUs',
        description: 'Large catalog',
        color: '#3B82F6',
        min: 100,
        max: 500
    },
    'products:500+': {
        category: 'products',
        name: '500+',
        label: '500+ SKUs',
        description: 'Enterprise-level',
        color: '#8B5CF6',
        min: 500,
        max: Infinity
    },

    // ============================================
    // REVENUE ESTIMATE (revenue:*)
    // ============================================
    'revenue:<20k': {
        category: 'revenue',
        name: '<20k',
        label: '<$20k',
        description: 'Hobbyist/side business',
        color: '#EF4444',
        min: 0,
        max: 19999
    },
    'revenue:20k-100k': {
        category: 'revenue',
        name: '20k-100k',
        label: '$20k-$100k',
        description: 'Small business',
        color: '#10B981',
        min: 20000,
        max: 99999
    },
    'revenue:100k-500k': {
        category: 'revenue',
        name: '100k-500k',
        label: '$100k-$500k',
        description: 'IDEAL RANGE',
        color: '#22C55E',
        min: 100000,
        max: 499999
    },
    'revenue:500k+': {
        category: 'revenue',
        name: '500k+',
        label: '$500k+',
        description: 'Larger business',
        color: '#3B82F6',
        min: 500000,
        max: Infinity
    },

    // ============================================
    // SPECIAL (special:*)
    // ============================================
    'special:beta_user': {
        category: 'special',
        name: 'beta_user',
        label: 'Beta User',
        description: 'Tested KrissKross in beta',
        color: '#8B5CF6',
        icon: '🧪'
    },
    'special:referral_source': {
        category: 'special',
        name: 'referral_source',
        label: 'Referral',
        description: 'Referred by existing customer',
        color: '#10B981',
        icon: '🤝'
    },
    'special:competitor_user': {
        category: 'special',
        name: 'competitor_user',
        label: 'Competitor User',
        description: 'Uses Runway/Pika/etc.',
        color: '#F59E0B',
        icon: '🔄'
    },
    'special:high_value': {
        category: 'special',
        name: 'high_value',
        label: 'High Value',
        description: 'Potential enterprise customer',
        color: '#22C55E',
        icon: '💎'
    },
    'special:blacklist': {
        category: 'special',
        name: 'blacklist',
        label: 'Blacklist',
        description: 'Do not contact',
        color: '#DC2626',
        icon: '🚫'
    }
};

/**
 * Get all tags in a specific category
 */
export function getTagsByCategory(category) {
    return Object.entries(TAG_DEFINITIONS)
        .filter(([_, def]) => def.category === category)
        .map(([fullTag, def]) => ({ fullTag, ...def }));
}

/**
 * Get tag definition by full tag name
 */
export function getTagDefinition(fullTag) {
    return TAG_DEFINITIONS[fullTag] || null;
}

/**
 * Validate if a tag exists
 */
export function isValidTag(fullTag) {
    return fullTag in TAG_DEFINITIONS;
}

/**
 * Get all category names
 */
export function getAllCategories() {
    return Object.values(TAG_CATEGORIES);
}
