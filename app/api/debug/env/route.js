import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        hasApifyToken: !!process.env.APIFY_API_TOKEN,
        tokenLength: process.env.APIFY_API_TOKEN?.length || 0,
        tokenPreview: process.env.APIFY_API_TOKEN ? `${process.env.APIFY_API_TOKEN.substring(0, 10)}...` : 'NOT_FOUND'
    });
}
