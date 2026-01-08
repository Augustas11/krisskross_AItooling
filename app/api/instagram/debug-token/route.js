/**
 * Debug Token Retrieval API Route
 * GET /api/instagram/debug-token
 * 
 * Tests if token-manager can be imported and token retrieved in API route context
 */

import { NextResponse } from 'next/server';

export async function GET(request) {
    const steps = [];

    try {
        steps.push('1. Attempting to import token-manager...');

        const { getToken } = await import('@/lib/token-manager.js');
        steps.push('✅ token-manager imported successfully');

        steps.push('2. Calling getToken()...');
        const token = await getToken();
        steps.push(`✅ getToken() returned ${token ? 'a token' : 'null'}`);

        if (token) {
            steps.push(`3. Token format: ${token.substring(0, 20)}...`);
            steps.push(`4. Token length: ${token.length} characters`);
            steps.push(`5. Starts with EAAK: ${token.startsWith('EAAK')}`);
        }

        return NextResponse.json({
            success: true,
            tokenExists: !!token,
            tokenPrefix: token ? token.substring(0, 20) : null,
            tokenLength: token ? token.length : 0,
            startsWithEAAK: token ? token.startsWith('EAAK') : false,
            steps
        });

    } catch (error) {
        steps.push(`❌ Error: ${error.message}`);

        return NextResponse.json({
            success: false,
            error: error.message,
            stack: error.stack,
            steps
        }, { status: 500 });
    }
}
