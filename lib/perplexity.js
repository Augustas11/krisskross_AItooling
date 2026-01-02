
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
    // Enhanced prompt requesting structured JSON data
    const query = `Analyze the e-commerce brand "${name}" (${website || instagram || 'No URL'}). 
    
    Research and return a STRICT JSON object with the following fields:
    {
        "category": "Exact Business/Product Category",
        "audience_vibe": "Target Audience & Brand Vibe",
        "social_style": "Social Media Content Style (Video/Static/UGC?)",
        "location": "HQ Location (City, Country)",
        "email": "Contact Email (if found)",
        "phone": "Phone Number (if found)",
        "instagram_handle": "Instagram handle (if different/found)",
        "instagram_followers": "Approx follower count (number only) or null",
        "metrics_status": "Active/Inactive",
        "pain_points": "Visible struggles/complaints",
        "summary": "A concise text summary for context"
    }
    
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
                        content: 'You are a deep research assistant. You MUST return valid JSON only.'
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
        const content = data.choices?.[0]?.message?.content;

        // Attempt to parse JSON
        let result = null;
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                result = JSON.parse(jsonMatch[0]);
            } catch (e) {
                console.warn('[PERPLEXITY] JSON parse failed, returning raw text as summary');
                result = { summary: content };
            }
        } else {
            result = { summary: content };
        }

        console.log(`[PERPLEXITY] Research complete for ${name}`);
        return result;

    } catch (error) {
        console.error('[PERPLEXITY] Research failed:', error);
        return null;
    }
}
