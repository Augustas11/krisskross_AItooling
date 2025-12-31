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

// Helper to fetch HTML content - tries multiple methods
async function fetchHtmlContent(url) {
    // Method 1: Try Firecrawl if available (best - handles JS rendering)
    const firecrawlKey = process.env.FIRECRAWL_API_KEY;
    if (firecrawlKey) {
        try {
            const { FirecrawlAppV1 } = await import('@mendable/firecrawl-js');
            const app = new FirecrawlAppV1({ apiKey: firecrawlKey });

            console.log('[Firecrawl] Attempting to scrape', url);
            const result = await app.scrapeUrl(url, {
                formats: ['markdown', 'html'],
                timeout: 30000
            });

            if (result.success) {
                console.log('[Firecrawl] Successfully retrieved content for', url);
                return {
                    html: result.html || '',
                    markdown: result.markdown || '',
                    text: result.markdown || result.html || ''
                };
            }
        } catch (e) {
            console.warn('[Firecrawl] Scrape failed:', e.message);
        }
    } else {
        console.log('[Firecrawl] API key not available, skipping');
    }

    // Method 2: Try axios with anti-bot headers (works for some sites)
    const axios = (await import('axios')).default;
    try {
        console.log('[Axios] Attempting direct fetch for', url);
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Cache-Control': 'max-age=0'
            },
            timeout: 15000,
            maxRedirects: 5
        });
        console.log('[Axios] Successfully retrieved HTML for', url);
        return response.data;
    } catch (e) {
        console.warn('[Axios] Direct fetch failed:', e.message, '- falling back to AI search');
    }

    return null;
}

// Helper to extract footer and contact sections from HTML
function extractRelevantSections(htmlContent) {
    if (!htmlContent) return '';

    const html = typeof htmlContent === 'string' ? htmlContent : htmlContent.html || htmlContent.text || '';

    // Try to extract footer section
    const footerMatch = html.match(/<footer[\s\S]*?<\/footer>/i);
    const contactMatch = html.match(/<[^>]*(contact|about)[\s\S]*?<\/[^>]+>/gi);

    let relevantHtml = '';

    if (footerMatch) {
        relevantHtml += '\n=== FOOTER SECTION ===\n' + footerMatch[0];
    }

    if (contactMatch && contactMatch.length > 0) {
        relevantHtml += '\n=== CONTACT SECTIONS ===\n' + contactMatch.slice(0, 3).join('\n');
    }

    // If we have markdown, use it as it's cleaner
    if (htmlContent.markdown) {
        relevantHtml = htmlContent.markdown.slice(0, 8000) + '\n\n' + relevantHtml;
    } else if (!relevantHtml) {
        // Fallback to first 8000 chars of HTML
        relevantHtml = html.slice(0, 8000);
    }

    return relevantHtml.slice(0, 10000); // Limit total size
}

// Helper for Perplexity Enrichment (FIXED: Now receives HTML content)
async function executePerplexityEnrich(url, name, apiKey, htmlContent = null) {
    const relevantHtml = htmlContent ? extractRelevantSections(htmlContent) : '';

    const prompt = relevantHtml
        ? `Extract contact information for the business "${name}" from the following website content.

WEBSITE CONTENT FROM ${url}:
${relevantHtml}

TASKS:
1. Find Contact Info: Email (full domain), Phone, Physical Address
2. Find Social Profiles: Instagram, TikTok, YouTube, Facebook (look for URLs in the content above)

CRITICAL INSTRUCTIONS:
- Extract information ONLY from the website content provided above
- Look for social media links (instagram.com, tiktok.com, etc.) in the HTML
- Extract email addresses from mailto: links or text patterns
- STRICTLY FORBIDDEN: Do NOT guess or construct URLs
- ONLY return information you can verify from the content above
- If a handle uses underscores (_) or dots (.), be precise

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

Output ONLY JSON.`
        : `CRITICAL: Unable to fetch website HTML. Perform a comprehensive web search to find contact information and social media profiles.

Business: "${name}"
Website: ${url}

SEARCH STRATEGY:
1. Search for "${name} TikTok" to find their TikTok profile
2. Search for "${name} Instagram" to find their Instagram profile
3. Search for "${name} contact email" or check their website's contact page
4. Search for "${name} Facebook" and "${name} YouTube"
5. Look for social media links in articles, reviews, or business directories mentioning this business

CRITICAL INSTRUCTIONS:
- Actively SEARCH for each social platform separately
- Find REAL, VERIFIED URLs (e.g., https://www.tiktok.com/@username)
- Do NOT construct URLs - only return URLs you find through search
- Check business directories (Yelp, Google Business, etc.) which often list social media
- Verify the social account matches the business name and website

Return STRICT JSON:
{
    "seller_name": "${name}",
    "contact_information": {
        "business_address": "string or null",
        "customer_service": {
            "phone_number": "string or null",
            "email": "string or null",
            "website": "${url}",
            "tiktok": "string or null (Full URL from search)",
            "instagram": "string or null (Full URL from search)",
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

// Helper for Grok Enrichment (FIXED: Now receives HTML content)
async function executeGrokEnrich(url, name, apiKey, htmlContent = null) {
    const relevantHtml = htmlContent ? extractRelevantSections(htmlContent) : '';

    const prompt = relevantHtml
        ? `Extract contact information for "${name}" from the following website content.

WEBSITE CONTENT FROM ${url}:
${relevantHtml}

TASKS:
- Find all social media links (TikTok, Instagram, YouTube, Facebook) in the content above
- Extract contact info (email, phone, address) from the content above

INSTRUCTIONS:
- Extract information ONLY from the website content provided above
- Look for social media URLs (instagram.com, tiktok.com, etc.)
- No citations [1][2]
- Use null for missing
- DO NOT guess or construct URLs - ONLY return links found in the content

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

Output ONLY JSON.`
        : `CRITICAL: Unable to fetch website HTML. Perform a comprehensive web search.

Business: "${name}"
Website: ${url}

SEARCH for:
- "${name} TikTok" -> Find TikTok profile URL
- "${name} Instagram" -> Find Instagram profile URL
- "${name} contact email"
- "${name} Facebook"
- "${name} YouTube"

Return STRICT JSON with actual found URLs (not constructed):
{
    "seller_name": "${name}",
    "contact_information": {
        "business_address": "string or null",
        "customer_service": {
            "phone_number": "string or null",
            "email": "string or null",
            "website": "${url}",
            "tiktok": "full URL or null",
            "instagram": "full URL or null",
            "youtube": "full URL or null",
            "facebook": "full URL or null"
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

                    // Fetch HTML content using Firecrawl (if available) or axios
                    send('status', 'Fetching website content...');
                    const htmlContent = await fetchHtmlContent(url);

                    if (htmlContent) {
                        send('status', 'Website content retrieved successfully');
                        console.log('[HTML Fetch] Content retrieved for', url);
                    } else {
                        send('status', 'Direct HTML fetch failed, falling back to web search');
                        console.warn('[HTML Fetch] Failed for', url);
                    }

                    send('status', 'Connecting to Perplexity Sonar-Pro Network...');
                    send('status', 'Analyzing content and extracting contact information...');

                    let result = await executePerplexityEnrich(url, name, perplexityKey, htmlContent);

                    // --- RECOVERY PASS: If Perplexity misses socials, try Grok ---
                    const cs = result.contact_information?.customer_service || {};
                    if (!cs.instagram || !cs.tiktok) {
                        const grokKey = process.env.GROK_API_KEY;
                        if (grokKey) {
                            try {
                                send('status', 'Performing secondary analysis via Grok...');
                                const grokResult = await executeGrokEnrich(url, name, grokKey, htmlContent);
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

                    // Fetch HTML content using Firecrawl (if available) or axios
                    send('status', 'Fetching website content...');
                    const htmlContent = await fetchHtmlContent(url);

                    if (htmlContent) {
                        send('status', 'Website content retrieved successfully');
                    } else {
                        send('status', 'Direct HTML fetch failed, falling back to web search');
                    }

                    send('status', 'Connecting to xAI Grok API...');
                    send('status', 'Analyzing content and extracting contact information...');

                    const result = await executeGrokEnrich(url, name, grokKey, htmlContent);

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
