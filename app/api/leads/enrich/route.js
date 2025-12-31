import { NextResponse } from 'next/server';
import { z } from 'zod';

// Helper to clean AI strings (strip citations, etc.)
function sanitizeAiData(data) {
    if (typeof data === 'string') {
        // Strip Perplexity citations like [1], [2], [1, 2]
        let cleaned = data.replace(/\[\s*\d+(?:\s*,\s*\d+)*\s*\]/g, '').trim();
        // Ignore obvious "not found" placeholders
        const placeholders = ['not available', 'not found', 'n/a', 'unknown', 'null'];
        if (placeholders.includes(cleaned.toLowerCase())) return null;
        return cleaned;
    }
    if (Array.isArray(data)) {
        return data.map(sanitizeAiData);
    }
    if (data !== null && typeof data === 'object') {
        const sanitized = {};
        for (const [key, value] of Object.entries(data)) {
            sanitized[key] = sanitizeAiData(value);
        }
        return sanitized;
    }
    return data;
}

// Helper for Perplexity Enrichment
async function executePerplexityEnrich(url, name, apiKey) {
    const prompt = `Perform a deep search for the business "${name}" (Website: ${url}).

TASKS:
1. Find Contact Info: Email (full domain), Phone, Physical Address.
2. Find Social Profiles: Instagram, TikTok, YouTube, Facebook.

CRITICAL INSTRUCTIONS:
- If links are not on the homepage, search the FOOTER and "Contact Us" pages.
- If still not found, SEARCH THE BROADER WEB (Instagram, TikTok, LinkedIn) to find their official profiles.
- DO NOT include citations like [1] or [2] in JSON values.
- Return null for missing fields (NEVER use "Not found" or "N/A").
- Focus on finding URLs containing 'tiktok.com' and 'instagram.com'.

Return STRICT JSON:
{
    "seller_name": "${name}",
    "contact_information": {
        "business_address": "string or null",
        "customer_service": {
            "phone_number": "string or null",
            "email": "string or null",
            "website": "${url}",
            "tiktok": "string or null (Full URL)",
            "instagram": "string or null (Full URL)",
            "youtube": "string or null",
            "facebook": "string or null"
        }
    }
}

Output ONLY JSON.`;

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'sonar-pro',
            messages: [
                { role: 'system', content: 'You are a precise data extraction assistant. You only output valid JSON. NEVER include citations like [1] or [2] in the JSON values.' },
                { role: 'user', content: prompt }
            ]
        })
    });

    if (!response.ok) {
        if (response.status === 429) {
            throw new Error('Perplexity Rate Limit Reached. Please wait a moment and try again.');
        }
        throw new Error(`Perplexity API failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    console.log(`[PERPLEXITY] Response for ${name}:`, content);

    // More robust JSON extraction
    const jsonMatch = content.match(/(\{[\s\S]*\})/);
    if (jsonMatch) {
        try {
            const rawJson = JSON.parse(jsonMatch[1]);
            return sanitizeAiData(rawJson);
        } catch (e) {
            console.error("JSON Parse Error for matched content:", e);
        }
    }

    // Fallback: try parsing the whole content
    try {
        const rawJson = JSON.parse(content);
        return sanitizeAiData(rawJson);
    } catch (e) {
        console.error("Final JSON Parse Error:", e);
        throw new Error("AI returned malformed data. Please try again.");
    }
}

// Helper for Grok Enrichment
async function executeGrokEnrich(url, name, apiKey) {
    const prompt = `Analyze "${name}" (${url}) and find all social media (TikTok, Instagram, YouTube, Facebook) and contact info.

Search the footer icons and the web to find official profiles.
- No citations [1][2].
- Use null for missing.
- Capture full email domains.

Return STRICT JSON:
{
    "seller_name": "${name}",
    "contact_information": {
        "business_address": "string or null",
        "customer_service": {
            "phone_number": "string or null",
            "email": "string or null",
            "website": "${url}",
            "tiktok": "string or null",
            "instagram": "string or null",
            "youtube": "string or null",
            "facebook": "string or null"
        }
    }
}

Output ONLY JSON.`;

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'grok-4-latest',
            messages: [
                { role: 'system', content: 'You are a precise data extraction assistant. You only output valid JSON. NEVER include citations in the JSON values.' },
                { role: 'user', content: prompt }
            ],
            stream: false,
            temperature: 0
        })
    });

    if (!response.ok) {
        throw new Error(`Grok API failed: ${response.status}`);
    }

    const data = await response.json();
    const rawJson = JSON.parse(data.choices[0].message.content);
    return sanitizeAiData(rawJson);
}

export async function POST(req) {
    const encoder = new TextEncoder();

    // Parse body first (block until we have parameters)
    let body;
    try {
        body = await req.json();
    } catch (e) {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { url, name, provider = 'perplexity' } = body;

    const stream = new ReadableStream({
        async start(controller) {
            const send = (type, data) => {
                const payload = JSON.stringify({ type, data });
                controller.enqueue(encoder.encode(payload + '\n'));
            };

            try {
                if (!url) throw new Error('URL is required');

                send('status', `Initializing ${provider} agent...`);

                if (provider === 'perplexity' || provider === 'firecrawl') {
                    const perplexityKey = process.env.PERPLEXITY_API_KEY;
                    if (!perplexityKey) throw new Error('Missing PERPLEXITY_API_KEY');

                    send('status', 'Connecting to Perplexity Sonar-Pro Network...');
                    send('status', 'Searching and analyzing live web data...');

                    let result = await executePerplexityEnrich(url, name, perplexityKey);

                    // --- RECOVERY PASS: If Perplexity misses socials, try Grok ---
                    const cs = result.contact_information?.customer_service || {};
                    if (!cs.instagram || !cs.tiktok) {
                        const grokKey = process.env.GROK_API_KEY;
                        if (grokKey) {
                            try {
                                send('status', 'Performing secondary Search via Grok...');
                                const grokResult = await executeGrokEnrich(url, name, grokKey);
                                const gcs = grokResult.contact_information?.customer_service || {};

                                if (gcs.instagram && !cs.instagram) cs.instagram = gcs.instagram;
                                if (gcs.tiktok && !cs.tiktok) cs.tiktok = gcs.tiktok;
                                if (gcs.youtube && !cs.youtube) cs.youtube = gcs.youtube;
                                if (gcs.facebook && !cs.facebook) cs.facebook = gcs.facebook;

                                console.log('[RECOVERY] Grok found missing socials:', gcs);
                            } catch (recoveryErr) {
                                console.warn('[RECOVERY] Grok fallback failed:', recoveryErr.message);
                            }
                        }
                    }

                    send('status', 'Extracting contact entities...');
                    send('result', { enrichedData: result });

                } else if (provider === 'grok') {
                    const grokKey = process.env.GROK_API_KEY;
                    if (!grokKey) throw new Error('Missing GROK_API_KEY');

                    send('status', 'Connecting to xAI Grok API...');
                    send('status', 'Reasoning about page content...');

                    const result = await executeGrokEnrich(url, name, grokKey);

                    send('status', 'Formatting extracted data...');
                    send('result', { enrichedData: result });

                } else {
                    throw new Error(`Unsupported provider: ${provider}`);
                }

            } catch (error) {
                console.error('Enrichment Error:', error);
                send('error', error.message || 'Unknown error during enrichment');
            } finally {
                controller.close();
            }
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'application/x-ndjson',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}
