import { NextResponse } from 'next/server';
import { enrollLeadInSequence, getDefaultColdOutreachSequenceId } from '@/lib/email-sequences';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

/**
 * POST /api/sequences/enroll
 * Enroll a lead in an email sequence
 */
export async function POST(req) {
    console.log('📧 [API] POST /api/sequences/enroll');

    if (!isSupabaseConfigured()) {
        return NextResponse.json(
            { error: 'Supabase not configured' },
            { status: 500 }
        );
    }

    try {
        const { leadId, sequenceId } = await req.json();

        if (!leadId) {
            return NextResponse.json(
                { error: 'leadId is required' },
                { status: 400 }
            );
        }

        // If no sequenceId provided, use default cold outreach sequence
        let targetSequenceId = sequenceId;
        if (!targetSequenceId) {
            targetSequenceId = await getDefaultColdOutreachSequenceId();
            if (!targetSequenceId) {
                return NextResponse.json(
                    { error: 'No default sequence found' },
                    { status: 404 }
                );
            }
        }

        // Verify lead exists
        const { data: lead, error: leadError } = await supabase
            .from('leads')
            .select('id, name, email')
            .eq('id', leadId)
            .single();

        if (leadError || !lead) {
            return NextResponse.json(
                { error: 'Lead not found' },
                { status: 404 }
            );
        }

        // Enroll lead
        const result = await enrollLeadInSequence(leadId, targetSequenceId);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            message: `Lead ${lead.name} enrolled in sequence`,
            enrollment: result.enrollment
        });

    } catch (error) {
        console.error('❌ [API] Error enrolling lead:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
