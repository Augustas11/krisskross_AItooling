/**
 * AI Caption Analyzer
 * Uses Claude API to analyze Instagram captions for pain points
 */

/**
 * Analyze Instagram captions to detect pain points
 * @param {array} latestPosts - Array of post objects from Apify with caption field
 * @returns {array} Array of pain point tags with confidence scores
 */
/**
 * Analyze all Lead Data to generate comprehensive tags
 * @param {array} latestPosts - Array of post objects from Apify
 * @param {object} leadContext - Full lead object with website, description, etc.
 * @returns {array} Array of tags with confidence scores
 */
export async function analyzeLeadForTags(latestPosts, leadContext = {}) {
    // 1. Gather all available text context
    const captivesText = latestPosts
        ? latestPosts
            .map(post => post.caption)
            .filter(c => c && c.trim().length > 0)
            .slice(0, 15) // Analyze more posts
            .join('\n---\n')
        : '';

    const bio = latestPosts?.[0]?.ownerUsername
        ? `Bio for @${latestPosts[0].ownerUsername}` // We might not have bio text passed here, but usually it's in leadContext
        : '';

    const contextText = `
    LEAD CONTEXT:
    - Business Name: ${leadContext.name || 'Unknown'}
    - Category: ${leadContext.productCategory || 'N/A'}
    - Description: ${leadContext.briefDescription || 'N/A'}
    - Website: ${leadContext.website || 'N/A'}
    - Instagram Bio: ${leadContext.biography || 'N/A'}
    - Instagram Category: ${leadContext.instagramBusinessCategory || 'N/A'}
    - Has Reels/Video: ${leadContext.hasReels ? 'Yes' : 'No'}
    - Avg Video Views: ${leadContext.avgVideoViews || 'N/A'}
    
    DEEP WEB RESEARCH (From Perplexity):
    ${(typeof leadContext.researchNotes === 'object' ? JSON.stringify(leadContext.researchNotes) : (leadContext.researchNotes || 'No deep research available.')).substring(0, 4000).replace(/`/g, "'")}
    
    INSTAGRAM CONTENT (Captions):
    ${captivesText || 'No recent captions available.'}
    `;

    if (contextText.length < 50) {
        console.log('[AI] Not enough context to analyze.');
        return [];
    }

    if (!process.env.ANTHROPIC_API_KEY) {
        console.warn('⚠️ [AI] No ANTHROPIC_API_KEY found.');
        return [];
    }

    // 2. Construct Prompt with Definition Reference
    const prompt = `You are a Lead Enrichment Expert for KrissKross (an AI video tool for e-commerce).
Your goal is to infer the most accurate tags for this lead based on the provided data.

${contextText}

AVAILABLE TAG CATEGORIES AND DEFINITIONS:

1. BUSINESS TYPE (Pick ONE best fit):
- business:fashion (Clothing, apparel)
- business:accessories (Jewelry, bags, hats)
- business:beauty (Cosmetics, skin, hair)
- business:shoes (Footwear)
- business:home (Decor, furniture)
- business:electronics (Gadgets)
- business:other

2. CONTENT STYLE (Pick ONE best fit if posts exist):
- content:selfie (Selfie-style, personal)
- content:static (Only photos, no video)
- content:ugc (User-generated, testimonials)
- content:professional (Studio quality, polished)
- content:mixed (Mix of styles)

3. PAIN POINTS (Pick ALL that apply with high confidence):
- pain:manual_video (Mentions spending time editing, "editing day", etc)
- pain:slow_editing (Complains about speed/effort)
- pain:low_diversity (Same model always shown)
- pain:uses_freelancers (Mentions hiring editors/videographers)
- pain:no_models (Only product shots, needs human element)

4. POSTING FREQUENCY (Infer from context/dates):
- posting:low (Rarely posts)
- posting:ideal (Active, 2-5 times/week)
- posting:high (Daily+)
- posting:power_user (Spammy amount)

INSTRUCTIONS:
- Analyze the text deepy. Look for keywords, tone, and implied needs.
- If data is missing for a category (e.g. no posts for "Content Style"), SKIP IT.
- For Pain Points, require explicit evidence or strong implication.
- Return a JSON object with a list of "tags".
- "tags" should be objects: { "full_tag": "category:name", "confidence": 0.0-1.0, "reason": "Short explanation" }

EXAMPLE OUTPUT:
{
  "tags": [
    { "full_tag": "business:fashion", "confidence": 0.95, "reason": "Sells dresses and tops" },
    { "full_tag": "content:static", "confidence": 0.8, "reason": "Only posts photos of clothes on hangers" },
    { "full_tag": "pain:no_models", "confidence": 0.7, "reason": "Feed lacks human presence" }
  ]
}
`;

    try {
        console.log('[AI] Sending analysis request to Claude...');
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': process.env.ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                model: 'claude-3-haiku-20240307',
                max_tokens: 1000,
                temperature: 0.2, // Low temp for consistent tagging
                messages: [{ role: 'user', content: prompt }]
            })
        });

        if (!response.ok) {
            console.error('[AI] Claude API error:', response.status);
            return [];
        }

        const result = await response.json();
        const content = result.content[0].text;

        // Extract JSON
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return [];

        // Extract JSON - Updated to be more robust
        let jsonStr = '';
        try {
            const firstOpen = content.indexOf('{');
            const lastClose = content.lastIndexOf('}');
            if (firstOpen !== -1 && lastClose !== -1) {
                jsonStr = content.substring(firstOpen, lastClose + 1);
                // Basic cleanup of potential markdown artifacts
                jsonStr = jsonStr.replace(/[\n\r]/g, ' ').replace(/,\s*}/g, '}');

                const parsed = JSON.parse(jsonStr);
                const tags = parsed.tags || [];

                console.log(`[AI] Generated ${tags.length} tags from Claude`);

                return tags.map(t => ({
                    full_tag: t.full_tag,
                    confidence: t.confidence,
                    evidence: t.reason || t.evidence, // Handle both key names
                    applied_by: 'ai',
                    applied_at: new Date().toISOString()
                }));
            } else {
                console.warn('[AI] No JSON object found in response');
                return [];
            }
        } catch (e) {
            console.error('[AI] JSON Parse Failed:', e.message);
            console.error('[AI] Raw content was:', content.substring(0, 200) + '...');
            return [];
        }

    } catch (error) {
        console.error('[AI] Analysis failed:', error);
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
