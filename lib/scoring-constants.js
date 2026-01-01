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
