import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/instagram/mark-read
 * Mark an interaction as read
 * 
 * Request Body:
 * - interactionId: string
 */
export async function POST(request) {
    try {
        const body = await request.json();
        const { interactionId } = body;

        if (!interactionId) {
            return NextResponse.json({
                success: false,
                error: 'Interaction ID is required'
            }, { status: 400 });
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Update read_at timestamp
        const { data, error } = await supabase
            .from('instagram_interactions')
            .update({ read_at: new Date().toISOString() })
            .eq('id', interactionId)
            .select()
            .single();

        if (error) {
            console.error('Error marking as read:', error);
            return NextResponse.json({
                success: false,
                error: error.message
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            interaction: data
        });

    } catch (error) {
        console.error('Error in mark-read API:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
