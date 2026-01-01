
/**
 * Perplexity AI Integration
 * Used for deep web research on leads to supplement Apify data
 */

export async function researchLead(lead) {
    if (!process.env.PERPLEXITY_API_KEY) {
        console.warn('⚠️ [PERPLEXITY] No API key found. Skipping deep research.');
        return null;
    }

    const { name, website, instagram } = lead;

    // Build a comprehensive query that explicitly includes the website URL
    let query = `Research the e-commerce brand "${name}".`;

    // CRITICAL: Explicitly tell Perplexity to visit the website
    if (website && website !== 'N/A') {
        const cleanWebsite = website.startsWith('http') ? website : `https://${website}`;
        query += `\n\n**IMPORTANT: Visit and analyze their website at ${cleanWebsite}**`;
    }

    if (instagram && instagram !== 'N/A') {
        const igHandle = instagram.replace('@', '');
        query += `\nAlso check their Instagram: @${igHandle}`;
    }

    query += `\n\nProvide a detailed research summary covering:

    1. **Exact Business/Product Category**: What specific products do they sell? (Visit their website to confirm - don't guess!)
    2. **Target Audience & Brand Positioning**: Who are their customers? What's their brand vibe (luxury, affordable, trendy, etc.)?
    3. **Social Media & Content Strategy**:
       - Are they active on Instagram/TikTok?
       - Do they use high-quality video content, UGC, or just static product images?
       - How's their posting frequency?
    4. **Location & Geography**: Where are they based? Do they ship internationally?
    5. **Pain Points & Opportunities**:
       - Is their website modern or outdated?
       - Are they active on social media or dormant?
       - Any complaints or negative reviews?
       - Do they have video content or could they benefit from it?

    Be specific and factual. This research is for a marketing agency pitching AI video editing services for e-commerce.`;

    try {
        console.log(`[PERPLEXITY] Starting research for ${name}...`);

        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'sonar-pro',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a deep research assistant for an e-commerce agency. Be precise and factual.'
                    },
                    {
                        role: 'user',
                        content: query
                    }
                ],
                temperature: 0.1
            })
        });

        if (!response.ok) {
            console.error('[PERPLEXITY] API Error:', response.status, await response.text());
            return null;
        }

        const data = await response.json();
        const researchText = data.choices?.[0]?.message?.content;

        console.log(`[PERPLEXITY] Research complete for ${name} (${researchText?.length} chars)`);
        return researchText;

    } catch (error) {
        console.error('[PERPLEXITY] Research failed:', error);
        return null;
    }
}
