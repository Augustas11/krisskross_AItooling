import { NextResponse } from 'next/server';
import { FirecrawlAppV1 as FirecrawlApp, Firecrawl } from '@mendable/firecrawl-js';
import { z } from 'zod';

export async function POST(req) {
    try {
        const apiKey = process.env.FIRECRAWL_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'Missing FIRECRAWL_API_KEY in environment variables' }, { status: 500 });
        }

        const { url, deep } = await req.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        if (deep) {
            console.log(`[DEBUG] Strategic Deep Hunt started for: ${url}`);
            const firecrawl = new Firecrawl({ apiKey });

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

            if (!result.success) {
                throw new Error(result.error || 'Deep hunt failed');
            }

            return NextResponse.json({
                leads: result.data?.shops || [],
                message: result.data?.shops?.length > 0 ? `Found and verified ${result.data.shops.length} sellers via Deep Hunt.` : "No unique sellers found during deep hunt."
            });
        }

        const app = new FirecrawlApp({ apiKey });

        // Standard Scrape Logic (Existing)
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

        if (!scrapeResult.success) {
            throw new Error(scrapeResult.error || 'Firecrawl scrape failed');
        }

        console.log('Firecrawl Scrape Result:', JSON.stringify(scrapeResult, null, 2));
        const extractedData = scrapeResult.json || scrapeResult.data?.json || (scrapeResult.data && typeof scrapeResult.data === 'object' ? scrapeResult.data : null);

        if (!extractedData || !extractedData.shops) {
            return NextResponse.json({ leads: [], message: 'No shops were found. Try "Deep Hunt" for a more thorough search.' });
        }

        return NextResponse.json({
            leads: extractedData.shops,
            metadata: scrapeResult.metadata
        });

    } catch (error) {
        console.error('Firecrawl API Error:', error);
        return NextResponse.json({ error: error.message || 'Unknown error during lead sourcing' }, { status: 500 });
    }
}
