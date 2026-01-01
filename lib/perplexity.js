
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
    const query = `Analyze the e-commerce brand "${name}" (${website || instagram || 'No URL'}). 
    
    Research and return a concise summary covering:
    1. Exact Business/Product Category (What do they sell?)
    2. Target Audience & Brand Vibe.
    3. Social Media Content Style (Do they use high-quality video, UGC, or just static images? Are they active?)
    4. Location/Geography.
    5. Any visible pain points or struggles (e.g. "website outdated", "inactive info", "complaints").
    
    Focus on facts useful for a marketing agency pitching video editing services.`;

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
