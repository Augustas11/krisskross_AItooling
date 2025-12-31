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

export async function POST(req) {
    const logs = [];

    try {
        const apiKey = process.env.FIRECRAWL_API_KEY;
        if (!apiKey) {
            logs.push(createLog('error', 'Missing FIRECRAWL_API_KEY in environment variables'));
            return NextResponse.json({ error: 'Missing FIRECRAWL_API_KEY', logs }, { status: 500 });
        }

        const { url, deep } = await req.json();
        logs.push(createLog('request', 'Received lead sourcing request', { url, mode: deep ? 'Deep Hunt' : 'Fast Scrape' }));

        if (!url) {
            logs.push(createLog('error', 'URL is required'));
            return NextResponse.json({ error: 'URL is required', logs }, { status: 400 });
        }

        if (deep) {
            logs.push(createLog('info', 'Starting Deep Hunt mode with Firecrawl Agent'));
            const firecrawl = new Firecrawl({ apiKey });

            logs.push(createLog('api_call', 'Calling Firecrawl Agent API', { url }));
            const startTime = Date.now();

            const result = await firecrawl.agent({
                prompt: "Navigate this fashion listing/search page. For at least 5 unique product listings, navigate to their individual product pages. On each page, identify the seller (usually in 'Sold by'). Follow the seller link to their brand/profile page and extract: Seller Name, Business Address, Contact Email if available, and a brief description of their brand vibe. Return this as a list of unique sellers found.",
                schema: z.object({
                    shops: z.array(z.object({
                        name: z.string(),
                        productCategory: z.string().optional(),
                        storeUrl: z.string().optional(),
                        briefDescription: z.string().optional(),
                        enriched: z.boolean().default(true),
                        businessAddress: z.string().optional(),
                        email: z.string().optional(),
                        instagram: z.string().optional()
                    }))
                }),
                urls: [url]
            });

            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            logs.push(createLog('api_response', `Firecrawl Agent completed in ${duration}s`, {
                success: result.success,
                status: result.status,
                creditsUsed: result.creditsUsed
            }));

            if (!result.success) {
                logs.push(createLog('error', 'Deep hunt failed', { error: result.error }));
                throw new Error(result.error || 'Deep hunt failed');
            }

            const leadsFound = result.data?.shops?.length || 0;
            logs.push(createLog('success', `Found ${leadsFound} unique sellers`, { leads: result.data?.shops }));

            return NextResponse.json({
                leads: result.data?.shops || [],
                message: leadsFound > 0
                    ? `Found and verified ${leadsFound} sellers via Deep Hunt.`
                    : "No unique sellers found during deep hunt.",
                logs
            });
        }

        // Fast Scrape Mode
        logs.push(createLog('info', 'Starting Fast Scrape mode'));
        const app = new FirecrawlApp({ apiKey });

        logs.push(createLog('api_call', 'Calling Firecrawl scrapeUrl API', { url }));
        const startTime = Date.now();

        const scrapeResult = await app.scrapeUrl(url, {
            formats: ['json'],
            onlyMainContent: false,
            waitFor: 2000,
            jsonOptions: {
                prompt: "Identify and extract all the unique clothing brands, shops, and sellers from this Amazon results page. For each brand/shop, describe what they sell based on the products shown.",
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
                                    rating: { type: "string" },
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
        logs.push(createLog('api_response', `Firecrawl scrape completed in ${duration}s`, {
            success: scrapeResult.success,
            creditsUsed: scrapeResult.metadata?.creditsUsed
        }));

        if (!scrapeResult.success) {
            logs.push(createLog('error', 'Firecrawl scrape failed', { error: scrapeResult.error }));
            throw new Error(scrapeResult.error || 'Firecrawl scrape failed');
        }

        const extractedData = scrapeResult.json || scrapeResult.data?.json || (scrapeResult.data && typeof scrapeResult.data === 'object' ? scrapeResult.data : null);

        if (!extractedData || !extractedData.shops) {
            logs.push(createLog('warning', 'No shops found in extraction'));
            return NextResponse.json({
                leads: [],
                message: 'No shops were found. Try "Deep Hunt" for a more thorough search.',
                logs
            });
        }

        const leadsFound = extractedData.shops.length;
        logs.push(createLog('success', `Extracted ${leadsFound} shop names from page`));

        return NextResponse.json({
            leads: extractedData.shops,
            metadata: scrapeResult.metadata,
            logs
        });

    } catch (error) {
        logs.push(createLog('error', 'Fatal error during lead sourcing', { error: error.message, stack: error.stack }));
        console.error('Firecrawl API Error:', error);
        return NextResponse.json({
            error: error.message || 'Unknown error during lead sourcing',
            logs
        }, { status: 500 });
    }
}
