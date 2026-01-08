/**
 * Instagram Test Connection API Route
 * POST /api/instagram/test-connection
 * 
 * Tests Instagram API connection and permissions
 */

import { NextResponse } from 'next/server';
import instagramAPI from '@/lib/instagram-api';

export async function POST(request) {
    try {
        // Test basic API connectivity
        const accountResult = await instagramAPI.getAccountInfo();

        if (!accountResult.success) {
            return NextResponse.json({
                success: false,
                healthy: false,
                error: accountResult.error || 'Failed to connect to Instagram API'
            }, { status: 400 });
        }

        // Check permissions
        const permissionsResult = await instagramAPI.verifyPermissions();

        return NextResponse.json({
            success: true,
            healthy: true,
            account: accountResult.data,
            permissions: permissionsResult,
            warnings: permissionsResult.missing?.length > 0
                ? [`Missing permissions: ${permissionsResult.missing.join(', ')}`]
                : []
        });

    } catch (error) {
        console.error('Connection test error:', error);
        return NextResponse.json({
            success: false,
            healthy: false,
            error: error.message || 'Internal server error'
        }, { status: 500 });
    }
}
