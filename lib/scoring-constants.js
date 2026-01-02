// Scoring Constants & Color Definitions

export const TIERS = {
    GREEN: { label: 'GREEN', minScore: 70, color: 'bg-emerald-500 text-white', bgColor: 'bg-emerald-500', border: 'border-emerald-600' },
    YELLOW: { label: 'YELLOW', minScore: 40, color: 'bg-amber-400 text-amber-950', bgColor: 'bg-amber-400', border: 'border-amber-500' },
    RED: { label: 'RED', minScore: 0, color: 'bg-rose-500 text-white', bgColor: 'bg-rose-500', border: 'border-rose-600' },
    GRAY: { label: 'GRAY', minScore: -1, color: 'bg-gray-100 text-gray-600', bgColor: 'bg-gray-400', border: 'border-gray-200' } // Unscored
};

// FIT SCORE: Static, based on lead profile (followers, geography, business category)
export const FIT_SCORING_RULES = {
    BASE_SCORE: 50,
    TAG_WEIGHTS: {
        'followers:10k-100k': 20,
        'followers:100k+': 10,
        'followers:<1k': -20,
        'geo:US': 15,
        'geo:Taiwan': 15,
        'geo:Vietnam': -100, // Kill switch
        'platform:shopify': 5,
    }
};

// INTENT SCORE: Dynamic, based on behavior (pain points, trial usage, email engagement)
export const INTENT_SCORING_RULES = {
    BASE_SCORE: 50,
    TAG_WEIGHTS: {
        'pain:manual_editing': 15,
        'pain:slow_turnaround': 12,
        'pain:no_models': 10,
        'pain:low_engagement': 8,
        'trial:video_generated': 20,
        'trial:multiple_videos': 30,
        'email:opened': 10,
        'email:clicked': 15,
        'email:replied': 25,
        'activity:pricing_page_visit': 20,
    },
    DECAY_RATE: 0.10 // 10% per week of inactivity
};

export function getTierForScore(score) {
    if (score >= TIERS.GREEN.minScore) return 'GREEN';
    if (score >= TIERS.YELLOW.minScore) return 'YELLOW';
    return 'RED'; // Below 40 is RED
}

/**
 * Calculate FIT score (static, based on lead profile)
 */
export function calculateFitScore(lead) {
    let score = FIT_SCORING_RULES.BASE_SCORE;
    const tags = [];
    const breakdown = { 'base': FIT_SCORING_RULES.BASE_SCORE };

    // 1. Follower Count
    let followers = 0;
    if (typeof lead.instagram_followers === 'number') {
        followers = lead.instagram_followers;
    } else if (typeof lead.instagram_followers === 'string') {
        followers = parseInt(lead.instagram_followers.replace(/,/g, ''), 10) || 0;
    }

    if (followers > 100000) {
        const w = FIT_SCORING_RULES.TAG_WEIGHTS['followers:100k+'];
        score += w;
        tags.push('followers:100k+');
        breakdown['followers:100k+'] = w;
    } else if (followers >= 10000 && followers <= 100000) {
        const w = FIT_SCORING_RULES.TAG_WEIGHTS['followers:10k-100k'];
        score += w;
        tags.push('followers:10k-100k');
        breakdown['followers:10k-100k'] = w;
    } else if (followers > 0 && followers < 1000) {
        const w = FIT_SCORING_RULES.TAG_WEIGHTS['followers:<1k'];
        score += w;
        tags.push('followers:<1k');
        breakdown['followers:<1k'] = w;
    }

    // 2. Geography
    const list = (lead.location || '') + ' ' + (lead.biography || '') + ' ' + (lead.businessAddress || '');
    const textContext = list.toLowerCase();

    if (textContext.includes('vietnam') || textContext.includes(' vn ')) {
        const w = FIT_SCORING_RULES.TAG_WEIGHTS['geo:Vietnam'];
        score += w;
        tags.push('geo:Vietnam');
        breakdown['geo:Vietnam'] = w;
    } else if (textContext.includes('usa') || textContext.includes('united states') || textContext.includes(' ny ') || textContext.includes(' ca ')) {
        const w = FIT_SCORING_RULES.TAG_WEIGHTS['geo:US'];
        score += w;
        tags.push('geo:US');
        breakdown['geo:US'] = w;
    } else if (textContext.includes('taiwan')) {
        const w = FIT_SCORING_RULES.TAG_WEIGHTS['geo:Taiwan'];
        score += w;
        tags.push('geo:Taiwan');
        breakdown['geo:Taiwan'] = w;
    }

    // 3. Platform
    if (textContext.includes('shopify')) {
        const w = FIT_SCORING_RULES.TAG_WEIGHTS['platform:shopify'];
        score += w;
        tags.push('platform:shopify');
        breakdown['platform:shopify'] = w;
    }

    // Clamp score 0-100
    score = Math.max(0, Math.min(100, score));

    return {
        fitScore: score,
        fitTags: tags,
        fitBreakdown: breakdown
    };
}

/**
 * Calculate INTENT score (dynamic, based on behavior)
 */
export function calculateIntentScore(lead) {
    let score = INTENT_SCORING_RULES.BASE_SCORE;
    const tags = lead.tags || [];
    const breakdown = { 'base': INTENT_SCORING_RULES.BASE_SCORE };

    // Check tags for pain points and behavioral signals
    tags.forEach(tag => {
        if (INTENT_SCORING_RULES.TAG_WEIGHTS[tag]) {
            const w = INTENT_SCORING_RULES.TAG_WEIGHTS[tag];
            score += w;
            breakdown[tag] = w;
        }
    });

    // Apply lead decay if last_activity_at is old
    if (lead.last_activity_at || lead.lastActivityAt) {
        const lastActivity = new Date(lead.last_activity_at || lead.lastActivityAt);
        const now = new Date();
        const daysSinceActivity = (now - lastActivity) / (1000 * 60 * 60 * 24);
        const weeksSinceActivity = Math.floor(daysSinceActivity / 7);

        if (weeksSinceActivity > 0) {
            const decayFactor = Math.pow((1 - INTENT_SCORING_RULES.DECAY_RATE), weeksSinceActivity);
            const decayAmount = score * (1 - decayFactor);
            score = Math.round(score * decayFactor);
            breakdown['decay'] = -Math.round(decayAmount);
        }
    }

    // Clamp score 0-100
    score = Math.max(0, Math.min(100, score));

    return {
        intentScore: score,
        intentBreakdown: breakdown
    };
}

/**
 * Calculate combined lead score (for backward compatibility)
 * Priority = Fit × Intent (0-10,000)
 */
export function calculateLeadScore(lead) {
    const { fitScore, fitTags, fitBreakdown } = calculateFitScore(lead);
    const { intentScore, intentBreakdown } = calculateIntentScore(lead);

    const priorityScore = fitScore * intentScore; // 0-10,000
    const combinedScore = Math.round((fitScore + intentScore) / 2); // Average for tier

    return {
        score: combinedScore, // For backward compatibility
        fitScore,
        intentScore,
        priorityScore,
        tier: getTierForScore(combinedScore),
        tags: fitTags,
        breakdown: { ...fitBreakdown, ...intentBreakdown }
    };
}
