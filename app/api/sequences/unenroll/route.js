import { NextResponse } from 'next/server';
import { unenrollLeadFromSequence } from '@/lib/email-sequences';
import { isSupabaseConfigured } from '@/lib/supabase';

/**
 * POST /api/sequences/unenroll
 * Unenroll a lead from their current sequence
 */
export async function POST(req) {
    console.log('📧 [API] POST /api/sequences/unenroll');

    if (!isSupabaseConfigured()) {
        return NextResponse.json(
            { error: 'Supabase not configured' },
            { status: 500 }
        );
    }

    try {
        const { leadId, reason } = await req.json();

        if (!leadId) {
            return NextResponse.json(
                { error: 'leadId is required' },
                { status: 400 }
            );
        }

        const result = await unenrollLeadFromSequence(leadId, reason || 'manual');

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Lead unenrolled from sequence'
        });

    } catch (error) {
        console.error('❌ [API] Error unenrolling lead:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
