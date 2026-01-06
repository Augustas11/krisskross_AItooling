
/**
 * Perplexity AI Integration
 * Used for deep web research on leads to supplement Apify data
 */

export async function researchLead(lead) {
    if (!process.env.PERPLEXITY_API_KEY) {
        console.warn('⚠️ [PERPLEXITY] No API key found. Skipping deep research.');
        return null;
    }

    const { name, website, instagram, storeUrl } = lead;

    // Use the most specific URL available for disambiguation
    const primaryUrl = website || storeUrl || (instagram ? `instagram.com/${instagram}` : 'No URL');
    const domainHint = website || storeUrl ? `IMPORTANT: Focus ONLY on the specific business at ${website || storeUrl}. Do NOT confuse with similarly named brands.` : '';

    // THE NEW "DEEP RESEARCH" PROMPT with domain disambiguation
    const query = `
    Analyze the e-commerce brand "${name}" (Primary URL: ${primaryUrl}).
    
    ${domainHint}
    
    PERFORM A DEEP STRATEGIC ANALYSIS to help a marketing agency pitch video editing services to them.
    
    CRITICAL: Verify you are researching the exact brand at the URL provided, not a similarly-named company. If you find multiple brands with similar names, focus ONLY on the one matching the provided URL/domain.
    
    Your Output MUST be structured as a JSON object with the following fields:
    
    1. "company_overview": Concise but specific summary of who they are. Include their domain/website to confirm identity.
    2. "target_audience": Detailed buyer persona (age, interests, values).
    3. "current_content_strategy": Analyze their likely Instagram/TikTok/Website presence. Do they use video? Is it static? Is it high quality?
    4. "pain_points": 3-5 SPECIFIC pain points inferred from their digital presence (e.g. "Instagram feed is 90% static images, missed opportunity for reach", "Website lacks founder story/trust triggers", "Inconsistent posting schedule").
    5. "strategic_recommendations": 3 specific ideas for how Short-Form Video (Reels/TikTok) could solve their pain points and drive sales.
    6. "contact_info": { "instagram_handle": "@handle or null", "email": "email or null" }
    7. "confidence_score": Rate 1-10 how confident you are this is the correct brand (10 = certain, 5 = some ambiguity, 1 = uncertain).
    
    RETURN JSON ONLY. No preamble.
    `;

    try {
        console.log(`[PERPLEXITY] Starting deep research for ${name}...`);

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

                // Format the structured data into a readable summary string for the UI
                const p = result; // shorter alias
                const formattedSummary = `
**Company Overview**
${p.company_overview || 'N/A'}

**Target Audience**
${typeof p.target_audience === 'object' ?
                        `${p.target_audience.age || ''}, ${Array.isArray(p.target_audience.interests) ? p.target_audience.interests.join(', ') : ''}`
                        : p.target_audience}

**Pain Points**
${Array.isArray(p.pain_points) ? p.pain_points.map(pp => `- ${pp}`).join('\n') : p.pain_points}

**Content Strategy**
${typeof p.current_content_strategy === 'string' ? p.current_content_strategy : JSON.stringify(p.current_content_strategy)}

**Recommendations**
${Array.isArray(p.strategic_recommendations) ? p.strategic_recommendations.map(r => `- ${r}`).join('\n') : p.strategic_recommendations}
`;
                // Append the formatted string to the result object
                result.summary = formattedSummary.trim();

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
