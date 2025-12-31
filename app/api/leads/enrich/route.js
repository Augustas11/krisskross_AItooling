import { NextResponse } from 'next/server';
import { Firecrawl } from '@mendable/firecrawl-js';
import { z } from 'zod';

// Helper for Perplexity Enrichment
async function executePerplexityEnrich(url, name, apiKey) {
    const prompt = `Visit and analyze the website ${url} for the business "${name}".

IMPORTANT: I specifically need the TikTok link. Check the footer and header very carefully for ANY link containing "tiktok.com". Even if it's just an icon with no text, you MUST find the URL.

Look for:
1. Phone Number (Full format)
2. Email address (Full domain, no truncation)
3. Physical address
4. Social profiles: tiktok (MANDATORY if exists), instagram, youtube, facebook (Full URLs)
5. Look for any text like "@zeagoo" or "tiktok.com/@" on the page.

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

CRITICAL: capture FULL domain for emails. INCLUDE TIKTOK URL. Output ONLY JSON.`;

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'sonar-pro',
            messages: [
                { role: 'system', content: 'You are a precise data extraction assistant. You only output valid JSON.' },
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
            return JSON.parse(jsonMatch[1]);
        } catch (e) {
            console.error("JSON Parse Error for matched content:", e);
        }
    }

    // Fallback: try parsing the whole content
    try {
        return JSON.parse(content);
    } catch (e) {
        console.error("Final JSON Parse Error:", e);
        throw new Error("AI returned malformed data. Please try again.");
    }
}

// Helper for Grok Enrichment
async function executeGrokEnrich(url, name, apiKey) {
    const prompt = `Visit and analyze the website ${url} for the business "${name}".

IMPORTANT: Look for ALL social media links in the HEADER and FOOTER. 
Specifically hunt for TikTok (MANDATORY), Instagram, YouTube, and Facebook.
Find any links containing "tiktok.com" or handles like "@${name}".

Look for:
1. Phone Number (Full format)
2. Email address (Full domain, no truncation)
3. Physical address
4. Social profiles: tiktok, instagram, youtube, facebook (Full URLs)

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

CRITICAL: capture FULL domain for emails. INCLUDE TIKTOK URL if it exists in the footer Icons. Output ONLY JSON.`;

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'grok-4-latest',
            messages: [
                { role: 'system', content: 'You are a precise data extraction assistant. You only output valid JSON.' },
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
    const content = data.choices[0].message.content;

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        try {
            return JSON.parse(jsonMatch[0]);
        } catch (e) {
            console.error("JSON Parse Error", e);
        }
    }
    return JSON.parse(content);
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

                    const result = await executePerplexityEnrich(url, name, perplexityKey);

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
