/**
 * Instagram Token Verification API Route
 * POST /api/instagram/verify-token
 * 
 * Verifies Instagram access token and stores account info in database
 */

import { NextResponse } from 'next/server';
import instagramAPI from '@/lib/instagram-api';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export async function POST(request) {
    try {
        // Check if Supabase is configured
        if (!isSupabaseConfigured()) {
            return NextResponse.json({
                success: false,
                error: 'Supabase not configured. Check environment variables.'
            }, { status: 500 });
        }

        // Verify token and get account info from Instagram API
        const verifyResult = await instagramAPI.verifyToken();

        if (!verifyResult.success) {
            return NextResponse.json({
                success: false,
                error: verifyResult.error || 'Failed to verify Instagram token'
            }, { status: 400 });
        }

        const account = verifyResult.account;

        // Verify account is Business or Creator type
        if (!['BUSINESS', 'CREATOR'].includes(account.account_type)) {
            return NextResponse.json({
                success: false,
                error: 'Instagram account must be a Business or Creator account'
            }, { status: 400 });
        }

        // Update Instagram account info in existing credentials record
        const { data: credential, error: dbError } = await supabase
            .from('instagram_credentials')
            .update({
                instagram_account_id: account.id,
                instagram_username: account.username,
                connection_status: 'connected',
                last_sync_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', '550e8400-e29b-41d4-a716-446655440000')
            .select()
            .single();

        // Handle table doesn't exist error
        if (dbError && dbError.code === '42P01') {
            console.error('Instagram credentials table does not exist. Run migration first.');
            return NextResponse.json({
                success: false,
                error: 'Database migration required. Please run docs/20250104_instagram_integration.sql in Supabase SQL Editor first.',
                setup_required: true
            }, { status: 500 });
        }

        if (dbError) {
            console.error('Failed to update Instagram credentials:', dbError);
            return NextResponse.json({
                success: false,
                error: 'Failed to update credentials in database: ' + (dbError.message || 'Unknown error')
            }, { status: 500 });
        }

        console.log('✓ Instagram connection verified:', account.username);

        return NextResponse.json({
            success: true,
            account: {
                id: account.id,
                username: account.username,
                account_type: account.account_type
            },
            token_expires_at: credential?.token_expires_at,
            stored: true
        });

    } catch (error) {
        console.error('Instagram token verification error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Internal server error'
        }, { status: 500 });
    }
}
