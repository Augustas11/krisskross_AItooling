import { NextResponse } from 'next/server';
import { FirecrawlAppV1 as FirecrawlApp } from '@mendable/firecrawl-js';

export async function POST(req) {
    try {
        const apiKey = process.env.FIRECRAWL_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'Missing FIRECRAWL_API_KEY in environment variables' }, { status: 500 });
        }

        const app = new FirecrawlApp({ apiKey });

        const { url, category } = await req.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        // Using Firecrawl's LLM-based extraction to get shop names and details
        const scrapeResult = await app.scrapeUrl(url, {
            formats: ['json'],
            jsonOptions: {
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
            console.warn('No shops found in extraction. Result keys:', Object.keys(scrapeResult));
            return NextResponse.json({
                leads: [],
                message: 'No shops were found on this page. Try a different URL or ensure the page contains shop listings.',
                raw: scrapeResult
            });
        }

        return NextResponse.json({
            leads: extractedData.shops,
            metadata: scrapeResult.metadata
        });

    } catch (error) {
        console.error('Firecrawl API Error:', error);
        return NextResponse.json({
            error: error.message || 'Unknown error during lead sourcing',
        }, { status: 500 });
    }
}
