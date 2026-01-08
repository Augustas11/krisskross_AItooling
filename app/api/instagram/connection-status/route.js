/**
 * Instagram Connection Status API Route
 * GET /api/instagram/connection-status
 * 
 * Fetches current Instagram connection status from database
 */

import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export async function GET(request) {
    try {
        // Check if Supabase is configured
        if (!isSupabaseConfigured()) {
            return NextResponse.json({
                connected: false,
                connection_status: 'not_configured',
                message: 'Supabase not configured. Check environment variables.'
            });
        }

        // Fetch most recent credential record
        const { data: credential, error } = await supabase
            .from('instagram_credentials')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        // Handle table doesn't exist error (migration not run yet)
        if (error && error.code === '42P01') {
            console.warn('Instagram credentials table does not exist. Run migration first.');
            return NextResponse.json({
                connected: false,
                connection_status: 'not_configured',
                message: 'Database migration required. Run docs/20250104_instagram_integration.sql in Supabase.'
            });
        }

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
            console.error('Failed to fetch Instagram credentials:', error);
            return NextResponse.json({
                success: false,
                error: 'Database error: ' + (error.message || 'Unknown error')
            }, { status: 500 });
        }

        // No credentials found
        if (!credential) {
            return NextResponse.json({
                connected: false,
                connection_status: 'not_configured',
                message: 'Instagram API not configured'
            });
        }

        // Check if token is expired
        const tokenExpiry = new Date(credential.token_expires_at);
        const now = new Date();
        const isExpired = tokenExpiry < now;

        // Calculate days until expiry
        const daysUntilExpiry = Math.ceil((tokenExpiry - now) / (1000 * 60 * 60 * 24));

        return NextResponse.json({
            connected: credential.connection_status === 'connected' && !isExpired,
            connection_status: isExpired ? 'token_expired' : credential.connection_status,
            instagram_username: credential.instagram_username,
            instagram_account_id: credential.instagram_account_id,
            token_expires_at: credential.token_expires_at,
            days_until_expiry: daysUntilExpiry,
            token_expired: isExpired,
            last_sync_at: credential.last_sync_at,
            created_at: credential.created_at,
            updated_at: credential.updated_at
        });

    } catch (error) {
        console.error('Connection status error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Internal server error'
        }, { status: 500 });
    }
}
