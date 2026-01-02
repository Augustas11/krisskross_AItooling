
/**
 * Grok AI Research Module
 * Uses Grok API directly to research leads
 */
export async function researchLeadWithGrok(lead) {
    const grokKey = process.env.GROK_API_KEY;

    if (!grokKey) {
        console.warn('⚠️ [GROK] No GROK_API_KEY found. Skipping Grok research.');
        return null;
    }

    const { name, website } = lead;

    try {
        console.log(`[GROK] Starting research for ${name} (${website || 'No URL'})...`);

        const websiteContext = website ? `(Website: ${website})` : "Note: Website is currently UNKNOWN. You must find it.";
        const websiteInstruction = website ? `2. Browse ${website} if possible.` : "2. FIND their official website URL.";

        const prompt = `
        Research the brand "${name}" ${websiteContext}.
        
        GOAL: Find ALL contact info, specifically their Instagram handle and Website.
        
        INSTRUCTIONS:
        1. Search for "${name} official website" and "${name} Instagram".
        ${websiteInstruction}
        3. Check for their official Instagram handle (e.g. @handle).
        4. Extract contact email and phone.
        
        RETURN JSON ONLY:
        {
            "category": "Business Category",
            "location": "City, Country",
            "email": "Email",
            "phone": "Phone",
            "website": "Official Website URL (found or confirmed)",
            "tiktok": "TikTok Handle",
            "instagram_handle": "Instagram Handle (or null)",
            "summary": "Brief summary"
        }
        `;

        const response = await fetch('https://api.x.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${grokKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'grok-2-1212',
                messages: [
                    { role: 'system', content: 'You are a helpful assistant involved in lead enrichment. You output valid JSON.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.1,
                stream: false
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error(`[GROK] API Error: ${response.status} ${errText}`);
            throw new Error(`Grok API Error ${response.status}: ${errText}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        console.log('[GROK] Analysis Complete.');

        // Parse JSON
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return { summary: content };

    } catch (e) {
        console.error('[GROK] Request Failed:', e);
        return null;
    }
}
