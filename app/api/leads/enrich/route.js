import { NextResponse } from 'next/server';
import { Firecrawl } from '@mendable/firecrawl-js';
import { z } from 'zod';

// Helper for Perplexity Enrichment
async function executePerplexityEnrich(url, name, apiKey) {
    const prompt = `Research and extract contact information for the seller "${name}" associated with this URL: ${url}.
    Find: Business Address, Customer Service Email, Phone Number, Official TikTok Profile URL, Instagram Handle.
    Return a STRICT JSON object matching this schema:
    {
        "seller_name": "string",
        "contact_information": {
            "business_address": "string or null",
            "customer_service": {
                "phone_number": "string or null",
                "email": "string or null",
                "website": "string or null",
                "instagram": "string or null"
            }
        }
    }
    If a field is not found, use null. Do not include markdown or explanations. Output ONLY valid JSON.`;

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
        throw new Error(`Perplexity API failed: ${response.status}`);
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

// Helper for Grok Enrichment
async function executeGrokEnrich(url, name, apiKey) {
    const prompt = `Research and extract contact information for the seller "${name}" associated with this URL: ${url}.
    Find: Business Address, Customer Service Email, Phone Number, Official TikTok Profile URL, Instagram Handle.
    Return a STRICT JSON object matching this schema:
    {
        "seller_name": "string",
        "contact_information": {
            "business_address": "string or null",
            "customer_service": {
                "phone_number": "string or null",
                "email": "string or null",
                "website": "string or null",
                "instagram": "string or null"
            }
        }
    }
    If a field is not found, use null. Do not include markdown or explanations. Output ONLY valid JSON.`;

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
    try {
        const apiKey = process.env.FIRECRAWL_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'Missing FIRECRAWL_API_KEY in environment variables' }, { status: 500 });
        }

        const firecrawl = new Firecrawl({ apiKey });

        const { url, name, provider = 'firecrawl' } = await req.json();

        if (provider === 'perplexity') {
            const perplexityKey = process.env.PERPLEXITY_API_KEY;
            if (!perplexityKey) {
                return NextResponse.json({ error: 'Missing PERPLEXITY_API_KEY' }, { status: 500 });
            }

            try {
                const result = await executePerplexityEnrich(url, name, perplexityKey);
                // Wrap in expected format
                return NextResponse.json({
                    enrichedData: result
                });
            } catch (e) {
                return NextResponse.json({ error: e.message || 'Perplexity enrichment failed' }, { status: 500 });
            }
        }

        if (provider === 'grok') {
            const grokKey = process.env.GROK_API_KEY;
            if (!grokKey) {
                return NextResponse.json({ error: 'Missing GROK_API_KEY' }, { status: 500 });
            }

            try {
                const result = await executeGrokEnrich(url, name, grokKey);
                // Wrap in expected format
                return NextResponse.json({
                    enrichedData: result
                });
            } catch (e) {
                return NextResponse.json({ error: e.message || 'Grok enrichment failed' }, { status: 500 });
            }
        }

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
