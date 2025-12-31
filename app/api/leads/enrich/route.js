import { NextResponse } from 'next/server';
import { Firecrawl } from '@mendable/firecrawl-js';
import { z } from 'zod';

export async function POST(req) {
    try {
        const apiKey = process.env.FIRECRAWL_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'Missing FIRECRAWL_API_KEY in environment variables' }, { status: 500 });
        }

        const firecrawl = new Firecrawl({ apiKey });

        const { url, name } = await req.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        console.log(`[DEBUG] Agent enrichment started for: ${name} at ${url}`);

        const result = await firecrawl.agent({
            prompt: `Extract the seller name and all available contact information, including business address, customer service phone, email, and their official TikTok profile URL (or general website if TikTok is not found) for the seller "${name}" at the provided URL. Also find their official Instagram handle if possible.`,
            schema: z.object({
                seller_name: z.string().describe("The name of the seller"),
                contact_information: z.object({
                    business_address: z.string().describe("The seller's business address").optional(),
                    customer_service: z.object({
                        phone_number: z.string().describe("Customer service phone number").optional(),
                        email: z.string().describe("Customer service email address").optional(),
                        website: z.string().describe("TikTok profile URL or official website").optional(),
                        instagram: z.string().describe("Instagram handle or URL").optional()
                    }).describe("Customer service contact details").optional()
                }).describe("Contact details for the seller").optional()
            }),
            urls: [url],
        });

        if (!result.success) {
            throw new Error(result.error || 'Firecrawl agent failed');
        }

        console.log('[DEBUG] Agent enrichment result:', JSON.stringify(result, null, 2));

        return NextResponse.json({
            enrichedData: result.data || result // Handle different response shapes
        });

    } catch (error) {
        console.error('Firecrawl Agent Error:', error);
        return NextResponse.json({
            error: error.message || 'Unknown error during agent enrichment',
        }, { status: 500 });
    }
}
