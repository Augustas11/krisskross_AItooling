// Scoring Constants & Color Definitions

export const TIERS = {
    GREEN: { label: 'GREEN', minScore: 70, color: 'bg-green-100 text-green-800', border: 'border-green-300' },
    YELLOW: { label: 'YELLOW', minScore: 40, color: 'bg-yellow-100 text-yellow-800', border: 'border-yellow-300' },
    RED: { label: 'RED', minScore: 0, color: 'bg-red-100 text-red-800', border: 'border-red-300' },
    GRAY: { label: 'GRAY', minScore: -1, color: 'bg-gray-100 text-gray-800', border: 'border-gray-300' } // Unscored
};

export const SCORING_RULES = {
    BASE_SCORE: 50,
    TAG_WEIGHTS: {
        'followers:10k-100k': 20,
        'followers:100k+': 10,
        'followers:<1k': -20,
        'geo:US': 15,
        'geo:Taiwan': 15,
        'geo:Vietnam': -100, // Kill switch
        'pain:manual_editing': 10,
        'platform:shopify': 5,
        'activity:high': -10 // Power user might result in lower score if we don't want them
    }
};

export function getTierForScore(score) {
    if (score >= TIERS.GREEN.minScore) return 'GREEN';
    if (score >= TIERS.YELLOW.minScore) return 'YELLOW';
    return 'RED'; // Below 40 is RED
}

export function calculateLeadScore(lead) {
    let score = SCORING_RULES.BASE_SCORE;
    const tags = [];
    const breakdown = { 'base': SCORING_RULES.BASE_SCORE };

    // 1. Follower Count (Parse if string, handle null)
    let followers = 0;
    if (typeof lead.instagram_followers === 'number') {
        followers = lead.instagram_followers;
    } else if (typeof lead.instagram_followers === 'string') {
        followers = parseInt(lead.instagram_followers.replace(/,/g, ''), 10) || 0;
    }

    if (followers > 100000) {
        const w = SCORING_RULES.TAG_WEIGHTS['followers:100k+'];
        score += w;
        tags.push('followers:100k+');
        breakdown['followers:100k+'] = w;
    } else if (followers >= 10000 && followers <= 100000) {
        const w = SCORING_RULES.TAG_WEIGHTS['followers:10k-100k'];
        score += w;
        tags.push('followers:10k-100k');
        breakdown['followers:10k-100k'] = w;
    } else if (followers > 0 && followers < 1000) { // Only penalize if we ACTUALLY know they have <1k, not 0 (which might be unknown)
        const w = SCORING_RULES.TAG_WEIGHTS['followers:<1k'];
        score += w;
        tags.push('followers:<1k');
        breakdown['followers:<1k'] = w;
    }

    // 2. Geography
    const list = (lead.location || '') + ' ' + (lead.biography || '') + ' ' + (lead.businessAddress || '');
    const textContext = list.toLowerCase();

    if (textContext.includes('vietnam') || textContext.includes(' vn ')) {
        const w = SCORING_RULES.TAG_WEIGHTS['geo:Vietnam'];
        score += w;
        tags.push('geo:Vietnam');
        breakdown['geo:Vietnam'] = w;
    } else if (textContext.includes('usa') || textContext.includes('united states') || textContext.includes(' ny ') || textContext.includes(' ca ')) {
        const w = SCORING_RULES.TAG_WEIGHTS['geo:US'];
        score += w;
        tags.push('geo:US');
        breakdown['geo:US'] = w;
    }

    // 3. Platform
    if (textContext.includes('shopify')) {
        const w = SCORING_RULES.TAG_WEIGHTS['platform:shopify'];
        score += w;
        tags.push('platform:shopify');
        breakdown['platform:shopify'] = w;
    }

    // Clamp score 0-100
    score = Math.max(0, Math.min(100, score));

    return {
        score,
        tier: getTierForScore(score),
        tags,
        breakdown
    };
}
