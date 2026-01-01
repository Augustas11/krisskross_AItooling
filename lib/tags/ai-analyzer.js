/**
 * AI Caption Analyzer
 * Uses Claude API to analyze Instagram captions for pain points
 */

/**
 * Analyze Instagram captions to detect pain points
 * @param {array} latestPosts - Array of post objects from Apify with caption field
 * @returns {array} Array of pain point tags with confidence scores
 */
export async function analyzeCaptionsForPainPoints(latestPosts) {
    if (!latestPosts || latestPosts.length === 0) {
        console.log('[AI] No posts to analyze');
        return [];
    }

    // Extract captions
    const captions = latestPosts
        .map(post => post.caption)
        .filter(c => c && c.trim().length > 0)
        .slice(0, 10) // Analyze up to 10 most recent posts
        .join('\n\n---\n\n');

    if (!captions) {
        console.log('[AI] No captions found in posts');
        return [];
    }

    // Check for API key
    if (!process.env.ANTHROPIC_API_KEY) {
        console.warn('⚠️ [AI] No ANTHROPIC_API_KEY found, skipping caption analysis');
        return [];
    }

    const prompt = `You are analyzing Instagram captions from an e-commerce seller to identify pain points related to video production.

INSTAGRAM CAPTIONS:
${captions}

TASK: Identify if this seller has any of these pain points:
1. manual_video - They mention creating/editing videos manually, spending time on video editing
2. slow_editing - They mention editing taking a long time (hours, days, tedious)
3. low_diversity - They always feature the same person/model, mention wanting variety
4. uses_freelancers - They mention hiring others for video production, paying for content creation
5. no_models - They only show products without people, mention difficulty finding models

IMPORTANT:
- Only return pain points with STRONG evidence from the captions
- Confidence should be 0.7+ (70%+) to be useful
- If unsure, don't include it
- Look for explicit mentions, not assumptions

Return ONLY valid JSON in this exact format:
{
  "pain_points": [
    {
      "tag": "pain:manual_video",
      "confidence": 0.85,
      "evidence": "Caption mentions 'spent 3 hours editing this video'"
    }
  ]
}

If NO pain points found, return: {"pain_points": []}`;

    try {
        console.log('[AI] Analyzing captions with Claude...');

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': process.env.ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                model: 'claude-3-haiku-20240307', // Cheap, fast model
                max_tokens: 500,
                messages: [{
                    role: 'user',
                    content: prompt
                }]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[AI] Claude API error:', response.status, errorText);
            return [];
        }

        const result = await response.json();
        const aiResponse = result.content[0].text;

        console.log('[AI] Claude response:', aiResponse);

        // Parse JSON response
        const parsed = JSON.parse(aiResponse);
        const painPoints = parsed.pain_points || [];

        // Filter by confidence threshold
        const highConfidencePainPoints = painPoints.filter(p => p.confidence >= 0.7);

        console.log(`[AI] Found ${highConfidencePainPoints.length} high-confidence pain points`);

        return highConfidencePainPoints.map(p => ({
            full_tag: p.tag,
            confidence: p.confidence,
            evidence: p.evidence,
            applied_by: 'ai',
            applied_at: new Date().toISOString()
        }));

    } catch (error) {
        console.error('[AI] Error analyzing captions:', error);
        return [];
    }
}

/**
 * Analyze Instagram bio for business type keywords
 * @param {string} biography - Instagram bio text
 * @returns {string|null} Business type tag or null
 */
export function analyzeBusinessType(biography) {
    if (!biography) return null;

    const bio = biography.toLowerCase();

    // Business type detection (same as auto-tagger but from bio)
    if (bio.match(/fashion|clothing|apparel|boutique|wear/i)) {
        return 'business:fashion';
    } else if (bio.match(/jewelry|accessories|bags|watches|hats/i)) {
        return 'business:accessories';
    } else if (bio.match(/beauty|cosmetics|skincare|makeup/i)) {
        return 'business:beauty';
    } else if (bio.match(/shoes|footwear|sneakers|boots/i)) {
        return 'business:shoes';
    } else if (bio.match(/home|decor|furniture|interior/i)) {
        return 'business:home';
    } else if (bio.match(/tech|electronics|gadgets|devices/i)) {
        return 'business:electronics';
    }

    return null;
}
