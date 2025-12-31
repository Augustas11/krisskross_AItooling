import { NextResponse } from 'next/server';
import { FirecrawlAppV1 as FirecrawlApp, Firecrawl } from '@mendable/firecrawl-js';
import { z } from 'zod';

// Helper to create log entries
function createLog(type, message, data = null) {
    return {
        timestamp: new Date().toISOString(),
        type,
        message,
        data
    };
}

const KNOWN_LISTING_PATTERNS = [
    { regex: /amazon\..*\/s\?/, type: 'amazon_search' },
    { regex: /amazon\..*\/b\//, type: 'amazon_category' },
    { regex: /ebay\..*\/sch\//, type: 'ebay_search' },
    { regex: /etsy\..*\/c\//, type: 'etsy_category' },
    { regex: /shopify\.com\/collections/, type: 'shopify_collection' },
    { regex: /\/collections\/[^/]+$/, type: 'general_collection' },
    { regex: /\/category\/[^/]+$/, type: 'general_category' },
    { regex: /\/shop\/?$/, type: 'general_shop_root' },
];

function detectUrlType(url) {
    const urlLower = url.toLowerCase();
    for (const pattern of KNOWN_LISTING_PATTERNS) {
        if (pattern.regex.test(urlLower)) {
            return { isListing: true, type: pattern.type };
        }
    }
    return { isListing: false, type: 'unknown' };
}

async function executePerplexitySearch(url, apiKey) {
    const prompt = `Analyze the content related to this URL: ${url}. 
    This is likely a product listing page, category page, or search result.
    Your task is to identify and extract ALL unique clothing brands, shops, and sellers visible on this page.
    IMPORTANT:
    1. Look for lists of products or sellers.
    2. Try to find as many distinct shops/sellers as possible (aim for 20+ if available).
    3. If the page seems to load dynamically or scroll, simulate the context of a fully loaded page in your analysis to find more than just the top few results.
    4. Return a STRICT JSON object with a "shops" key containing an array of objects.
    5. Each object must have: "name", "productCategory", "storeUrl" (if found), "briefDescription".
    6. Do not include any markdown formatting or explanation, just the JSON string.`;

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
        const errText = await response.text();
        throw new Error(`Perplexity API failed: ${response.status} ${errText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Attempt to parse JSON from content (it might be wrapped in brackets or markdown)
    const jsonMatch = content.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch) {
        try {
            return JSON.parse(jsonMatch[0]);
        } catch (e) {
            console.error("JSON Parse Error in Perplexity match", e);
            // Fallback to trying to parse the whole string if match failed
        }
    }
    return JSON.parse(content);
}

export async function POST(req) {
    const logs = [];

    try {
        const apiKey = process.env.FIRECRAWL_API_KEY;
        const perplexityKey = process.env.PERPLEXITY_API_KEY;

        const { url, mode = 'smart', provider = 'firecrawl' } = await req.json(); // Default to 'smart' mode and 'firecrawl'
        logs.push(createLog('info', `Analyzed URL: ${url}`, { mode, provider }));

        if (provider === 'perplexity') {
            if (!perplexityKey) {
                return NextResponse.json({ error: 'Missing PERPLEXITY_API_KEY', logs }, { status: 500 });
            }
            logs.push(createLog('execution', 'Running Perplexity Search'));
            try {
                const startTime = Date.now();
                const perplexityResult = await executePerplexitySearch(url, perplexityKey);
                const duration = ((Date.now() - startTime) / 1000).toFixed(2);
                logs.push(createLog('api_response', `Perplexity completed in ${duration}s`));

                return NextResponse.json({
                    leads: perplexityResult.shops || [],
                    method: 'perplexity_search',
                    logs
                });
            } catch (e) {
                logs.push(createLog('error', 'Perplexity Exception', e.message));
                return NextResponse.json({ error: e.message, logs }, { status: 500 });
            }
        }

        if (!apiKey) {
            logs.push(createLog('error', 'Missing FIRECRAWL_API_KEY'));
            return NextResponse.json({ error: 'Missing FIRECRAWL_API_KEY', logs }, { status: 500 });
        }

        if (!url) {
            return NextResponse.json({ error: 'URL is required', logs }, { status: 400 });
        }

        // --- STRATEGY DETERMINATION ---
        const urlAnalysis = detectUrlType(url);
        let executeDeepHunt = false;

        // If user explicitly requested deep or fast, prompt respects it. 
        // If 'smart' (default), we decide.
        if (mode === 'deep') {
            executeDeepHunt = true;
        } else if (mode === 'fast') {
            executeDeepHunt = false;
        } else {
            // SMART MODE LOGIC:
            // 1. If it looks like a known massive listing (Amazon Search), keep it Fast.
            // 2. If it's unknown, try Fast first, but enable Auto-Escalation.
            if (urlAnalysis.isListing) {
                logs.push(createLog('strategy', `Identified known listing pattern (${urlAnalysis.type}). Prioritizing Fast Scrape.`));
                executeDeepHunt = false;
            } else {
                logs.push(createLog('strategy', 'URL pattern generic. Starting with Fast Scrape (Cost-Efficient).'));
                executeDeepHunt = false;
            }
        }

        // --- EXECUTION: TIER 1 (FAST SCRAPE) ---
        // Unless we prioritized Deep Hunt immediately, we try Fast Scrape first.
        let scrapeResult = null;

        if (!executeDeepHunt) {
            logs.push(createLog('execution', 'Running Layer 1: Fast Scrape'));
            const app = new FirecrawlApp({ apiKey });

            const prompt = "Identify and extract ALL the unique clothing brands, shops, and sellers from this page. Scroll effectively if needed. Return a list of EVERY shop found with their names and descriptions.";

            try {
                const startTime = Date.now();
                scrapeResult = await app.scrapeUrl(url, {
                    formats: ['json'],
                    jsonOptions: {
                        prompt: prompt,
                        schema: {
                            type: "object",
                            properties: {
                                shops: {
                                    type: "array",
                                    items: {
                                        type: "object",
                                        properties: {
                                            name: { type: "string" },
                                            productCategory: { type: "string" },
                                            storeUrl: { type: "string" },
                                            briefDescription: { type: "string" }
                                        },
                                        required: ["name"]
                                    }
                                }
                            }
                        }
                    }
                });

                const duration = ((Date.now() - startTime) / 1000).toFixed(2);
                logs.push(createLog('api_response', `Fast Scrape completed in ${duration}s`, { success: scrapeResult.success }));

                if (scrapeResult.success) {
                    const extracted = scrapeResult.json || scrapeResult.data?.json;
                    const leadsCount = extracted?.shops?.length || 0;
                    logs.push(createLog('result', `Layer 1 complete. Found ${leadsCount} leads.`));

                    // --- STRATEGY: ESCALATION CHECK ---
                    // If Fast Scrape found nothing AND we are in Smart Mode, escalate to Agent.
                    if (leadsCount === 0 && mode === 'smart') {
                        logs.push(createLog('escalation', 'Layer 1 yielded 0 leads. Auto-Escalating to Layer 2: Deep Hunt Agent.'));
                        executeDeepHunt = true; // Trigger Tier 2
                    } else {
                        // Success or manual fast mode
                        return NextResponse.json({
                            leads: extracted?.shops || [],
                            metadata: scrapeResult.metadata,
                            method: 'fast_scrape',
                            logs
                        });
                    }
                } else {
                    logs.push(createLog('error', 'Layer 1 failed', scrapeResult.error));
                    if (mode === 'smart') executeDeepHunt = true; // Retry on error if smart
                }
            } catch (e) {
                logs.push(createLog('error', 'Layer 1 Exception', e.message));
                if (mode === 'smart') executeDeepHunt = true;
            }
        }

        // --- EXECUTION: TIER 2 (AGENT / DEEP HUNT) ---
        if (executeDeepHunt) {
            logs.push(createLog('execution', 'Running Layer 2: Firecrawl Agent Deep Hunt'));
            const firecrawl = new Firecrawl({ apiKey });

            // For Agent, we give it more freedom to navigate
            const agentPrompt = urlAnalysis.isListing
                ? "Navigate this listing page. For up to 5 listings, visit the product page, find the 'Sold By' seller profile, and extract Seller Name, Description, and if possible URL/Socials."
                : "Explore this website to identify the business owner or key contact info. Look for 'About Us', 'Contact', or Footer links. Extract the Business Name, Description, and Contact details.";

            try {
                const startTime = Date.now();
                const result = await firecrawl.agent({
                    prompt: agentPrompt,
                    schema: z.object({
                        shops: z.array(z.object({
                            name: z.string(),
                            productCategory: z.string().optional(),
                            briefDescription: z.string().optional(),
                            email: z.string().optional(),
                            instagram: z.string().optional()
                        }))
                    }),
                    urls: [url]
                });
                const duration = ((Date.now() - startTime) / 1000).toFixed(2);
                logs.push(createLog('api_response', `Deep Hunt completed in ${duration}s`, { success: result.success }));

                if (result.success) {
                    const leadsFound = result.data?.shops?.length || 0;
                    logs.push(createLog('success', `Found ${leadsFound} sellers via Deep Hunt`));

                    return NextResponse.json({
                        leads: result.data?.shops || [],
                        method: 'deep_agent',
                        logs
                    });
                } else {
                    throw new Error(result.error || 'Agent execution failed');
                }
            } catch (e) {
                logs.push(createLog('error', 'Layer 2 Exception', e.message));
                // If both failed, we return error but with logs
                return NextResponse.json({
                    error: 'Lead discovery failed after trying fast and deep methods.',
                    logs
                }, { status: 500 });
            }
        }

    } catch (error) {
        logs.push(createLog('error', 'Fatal error', error.message));
        return NextResponse.json({
            error: error.message || 'Unknown error during sourcing',
            logs
        }, { status: 500 });
    }
}
