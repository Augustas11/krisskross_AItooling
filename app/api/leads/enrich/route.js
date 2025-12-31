import { NextResponse } from 'next/server';
import { Firecrawl } from '@mendable/firecrawl-js';
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

    const { url, name, provider = 'perplexity' } = body; // Default to Perplexity (Firecrawl out of credits)

    const stream = new ReadableStream({
        async start(controller) {
            const send = (type, data) => {
                const payload = JSON.stringify({ type, data });
                controller.enqueue(encoder.encode(payload + '\n'));
            };

            try {
                const apiKey = process.env.FIRECRAWL_API_KEY;
                if (!apiKey) throw new Error('Missing FIRECRAWL_API_KEY');

                if (!url) throw new Error('URL is required');

                send('status', `Initializing ${provider} agent...`);

                if (provider === 'perplexity') {
                    const perplexityKey = process.env.PERPLEXITY_API_KEY;
                    if (!perplexityKey) throw new Error('Missing PERPLEXITY_API_KEY');

                    send('status', 'Connecting to Perplexity Sonar-Pro Network...');
                    send('status', 'Searching and analyzing live web data...');

                    let result = await executePerplexityEnrich(url, name, perplexityKey);

                    // --- RECOVERY PASS: If socials missing, trigger Firecrawl Scrape ---
                    const cs = result.contact_information?.customer_service || {};
                    if (!cs.instagram || !cs.tiktok) {
                        try {
                            send('status', 'Verifying social handles via Page Scrape...');
                            const firecrawl = new Firecrawl({ apiKey });
                            const scrapeResult = await firecrawl.scrapeJs(url, {
                                formats: ['json'],
                                jsonOptions: {
                                    schema: z.object({
                                        instagram: z.string().optional(),
                                        tiktok: z.string().optional(),
                                        youtube: z.string().optional(),
                                        facebook: z.string().optional()
                                    }),
                                    prompt: "Find the social media URLs for this business. Look in the footer icons."
                                }
                            });

                            if (scrapeResult.success && scrapeResult.json) {
                                const sj = scrapeResult.json;
                                if (sj.instagram && !cs.instagram) cs.instagram = sj.instagram;
                                if (sj.tiktok && !cs.tiktok) cs.tiktok = sj.tiktok;
                                if (sj.youtube && !cs.youtube) cs.youtube = sj.youtube;
                                if (sj.facebook && !cs.facebook) cs.facebook = sj.facebook;
                                console.log('[RECOVERY] Firecrawl found missing socials:', sj);
                            }
                        } catch (recoveryErr) {
                            console.warn('[RECOVERY] Social discovery failed:', recoveryErr.message);
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
                    // Firecrawl Default
                    send('status', 'Initializing Firecrawl Agent...');
                    send('status', 'Navigating to target URL...');
                    send('status', 'Scraping page DOM & Assets...');

                    const firecrawl = new Firecrawl({ apiKey });
                    console.log(`[DEBUG] Firecrawl Agent started for: ${name}`);

                    send('status', 'Analyzing page content with LLM...');

                    const result = await firecrawl.agent({
                        prompt: `Extract the seller name and all available contact information for "${name}" at the provided URL.
                        
                        CRITICAL: Look carefully in footer sections, Contact pages, and social media icon links. Find:
                        - Phone Number (including formats like +1 XXX-XXX-XXXX or (XXX) XXX-XXXX)
                        - Email address (customer service, support, or info)
                        - Business/Physical address
                        - Instagram handle or profile URL
                        - TikTok profile URL
                        - Official website URL
                        
                        Return EXACTLY what you find on the page. Do not make up data.`,
                        schema: z.object({
                            seller_name: z.string().describe("The name of the seller"),
                            contact_information: z.object({
                                business_address: z.string().describe("The seller's business address").optional(),
                                customer_service: z.object({
                                    phone_number: z.string().describe("Customer service phone number").optional(),
                                    email: z.string().describe("Customer service email address").optional(),
                                    website: z.string().describe("Official website URL").optional(),
                                    tiktok: z.string().describe("Official TikTok profile URL").optional(),
                                    instagram: z.string().describe("Instagram handle or URL").optional()
                                }).describe("Customer service contact details").optional()
                            }).describe("Contact details for the seller").optional()
                        }),
                        urls: [url],
                    });

                    if (!result.success) {
                        throw new Error(result.error || 'Firecrawl agent failed');
                    }

                    // Transform Firecrawl response to expected nested structure
                    const rawData = result.data || result;
                    const normalizedData = {
                        seller_name: rawData.seller_name || name,
                        contact_information: {
                            business_address: rawData.business_address || rawData.contact_information?.business_address || null,
                            customer_service: {
                                phone_number: rawData.customer_service_phone || rawData.phone || rawData.contact_information?.customer_service?.phone_number || null,
                                email: rawData.email || rawData.customer_service_email || rawData.contact_information?.customer_service?.email || null,
                                website: rawData.website || rawData.contact_information?.customer_service?.website || null,
                                tiktok: rawData.tiktok_url || rawData.tiktok || rawData.contact_information?.customer_service?.tiktok || null,
                                instagram: rawData.instagram_handle || rawData.instagram || rawData.contact_information?.customer_service?.instagram || null,
                                youtube: rawData.youtube || rawData.contact_information?.customer_service?.youtube || null,
                                facebook: rawData.facebook || rawData.contact_information?.customer_service?.facebook || null
                            }
                        }
                    };

                    send('status', 'Validation complete.');
                    send('result', { enrichedData: normalizedData });
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
