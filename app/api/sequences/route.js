import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

/**
 * GET /api/sequences
 * Fetch all email sequences
 */
export async function GET(req) {
    console.log('📧 [API] GET /api/sequences');

    if (!isSupabaseConfigured()) {
        return NextResponse.json(
            { error: 'Supabase not configured' },
            { status: 500 }
        );
    }

    try {
        const { data: sequences, error } = await supabase
            .from('email_sequences')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({
            success: true,
            sequences: sequences || []
        });

    } catch (error) {
        console.error('❌ [API] Error fetching sequences:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST /api/sequences
 * Create a new email sequence
 */
export async function POST(req) {
    console.log('📧 [API] POST /api/sequences');

    if (!isSupabaseConfigured()) {
        return NextResponse.json(
            { error: 'Supabase not configured' },
            { status: 500 }
        );
    }

    try {
        const { name, description, sequence_type, emails } = await req.json();

        if (!name || !sequence_type || !emails || !Array.isArray(emails)) {
            return NextResponse.json(
                { error: 'Missing required fields: name, sequence_type, emails' },
                { status: 400 }
            );
        }

        const { data: sequence, error } = await supabase
            .from('email_sequences')
            .insert([{
                name,
                description,
                sequence_type,
                emails,
                active: true
            }])
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({
            success: true,
            message: 'Sequence created successfully',
            sequence
        });

    } catch (error) {
        console.error('❌ [API] Error creating sequence:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/sequences
 * Update an existing email sequence
 */
export async function PUT(req) {
    console.log('📧 [API] PUT /api/sequences');

    if (!isSupabaseConfigured()) {
        return NextResponse.json(
            { error: 'Supabase not configured' },
            { status: 500 }
        );
    }

    try {
        const { id, name, description, sequence_type, emails, active } = await req.json();

        if (!id) {
            return NextResponse.json(
                { error: 'Missing required field: id' },
                { status: 400 }
            );
        }

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (sequence_type !== undefined) updateData.sequence_type = sequence_type;
        if (emails !== undefined) updateData.emails = emails;
        if (active !== undefined) updateData.active = active;
        updateData.updated_at = new Date().toISOString();

        const { data: sequence, error } = await supabase
            .from('email_sequences')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({
            success: true,
            message: 'Sequence updated successfully',
            sequence
        });

    } catch (error) {
        console.error('❌ [API] Error updating sequence:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/sequences
 * Delete an email sequence
 */
export async function DELETE(req) {
    console.log('📧 [API] DELETE /api/sequences');

    if (!isSupabaseConfigured()) {
        return NextResponse.json(
            { error: 'Supabase not configured' },
            { status: 500 }
        );
    }

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'Missing required parameter: id' },
                { status: 400 }
            );
        }

        // Check if sequence has active enrollments
        const { data: enrollments, error: checkError } = await supabase
            .from('email_sequence_enrollments')
            .select('id')
            .eq('sequence_id', id)
            .is('completed_at', null)
            .is('unenrolled_at', null);

        if (checkError) throw checkError;

        if (enrollments && enrollments.length > 0) {
            return NextResponse.json(
                { error: `Cannot delete sequence with ${enrollments.length} active enrollments. Deactivate instead.` },
                { status: 400 }
            );
        }

        const { error } = await supabase
            .from('email_sequences')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({
            success: true,
            message: 'Sequence deleted successfully'
        });

    } catch (error) {
        console.error('❌ [API] Error deleting sequence:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
