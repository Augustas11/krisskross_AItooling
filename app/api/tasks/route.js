import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * GET /api/tasks
 * Get tasks for a lead or all pending tasks
 */
export async function GET(req) {
    console.log('📋 [API] GET /api/tasks');

    if (!isSupabaseConfigured()) {
        return NextResponse.json(
            { error: 'Supabase not configured' },
            { status: 500 }
        );
    }

    try {
        const { searchParams } = new URL(req.url);
        const leadId = searchParams.get('leadId');
        const status = searchParams.get('status') || 'pending';
        const dueToday = searchParams.get('dueToday') === 'true';

        let query = supabase
            .from('tasks')
            .select(`
                *,
                leads (
                    id,
                    name,
                    email,
                    product_category,
                    status
                )
            `)
            .order('due_date', { ascending: true });

        // Filter by lead
        if (leadId) {
            query = query.eq('lead_id', leadId);
        }

        // Filter by status
        if (status !== 'all') {
            query = query.eq('status', status);
        }

        // Filter by due today
        if (dueToday) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            query = query
                .gte('due_date', today.toISOString())
                .lt('due_date', tomorrow.toISOString());
        }

        const { data: tasks, error } = await query;

        if (error) throw error;

        return NextResponse.json({
            success: true,
            tasks: tasks || []
        });

    } catch (error) {
        console.error('❌ [API] Error fetching tasks:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST /api/tasks
 * Create a new task
 */
export async function POST(req) {
    console.log('📋 [API] POST /api/tasks');

    if (!isSupabaseConfigured()) {
        return NextResponse.json(
            { error: 'Supabase not configured' },
            { status: 500 }
        );
    }

    try {
        const body = await req.json();
        const { leadId, title, description, type, priority, dueDate } = body;

        if (!leadId || !title || !dueDate) {
            return NextResponse.json(
                { error: 'Missing required fields: leadId, title, dueDate' },
                { status: 400 }
            );
        }

        const task = {
            id: `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            lead_id: leadId,
            title,
            description: description || null,
            type: type || 'follow_up',
            priority: priority || 'medium',
            status: 'pending',
            due_date: dueDate,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('tasks')
            .insert([task]);

        if (error) throw error;

        console.log(`✅ [API] Created task: ${title} for lead ${leadId}`);

        return NextResponse.json({
            success: true,
            task
        });

    } catch (error) {
        console.error('❌ [API] Error creating task:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/tasks
 * Update a task (mark as completed, change priority, etc.)
 */
export async function PUT(req) {
    console.log('📋 [API] PUT /api/tasks');

    if (!isSupabaseConfigured()) {
        return NextResponse.json(
            { error: 'Supabase not configured' },
            { status: 500 }
        );
    }

    try {
        const body = await req.json();
        const { id, status, priority, dueDate } = body;

        if (!id) {
            return NextResponse.json(
                { error: 'Missing task ID' },
                { status: 400 }
            );
        }

        const updates = {
            updated_at: new Date().toISOString()
        };

        if (status) {
            updates.status = status;
            if (status === 'completed') {
                updates.completed_at = new Date().toISOString();
            }
        }

        if (priority) updates.priority = priority;
        if (dueDate) updates.due_date = dueDate;

        const { error } = await supabase
            .from('tasks')
            .update(updates)
            .eq('id', id);

        if (error) throw error;

        console.log(`✅ [API] Updated task: ${id}`);

        return NextResponse.json({
            success: true,
            message: 'Task updated'
        });

    } catch (error) {
        console.error('❌ [API] Error updating task:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/tasks
 * Delete a task
 */
export async function DELETE(req) {
    console.log('📋 [API] DELETE /api/tasks');

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
                { error: 'Missing task ID' },
                { status: 400 }
            );
        }

        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', id);

        if (error) throw error;

        console.log(`✅ [API] Deleted task: ${id}`);

        return NextResponse.json({
            success: true,
            message: 'Task deleted'
        });

    } catch (error) {
        console.error('❌ [API] Error deleting task:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

/**
 * Helper: Create automated follow-up tasks for a lead
 */
export async function createFollowUpTasks(leadId, leadName) {
    const now = new Date();

    const tasks = [
        {
            id: `task-${Date.now()}-1`,
            lead_id: leadId,
            title: `Follow up with ${leadName}`,
            description: 'Check if they received the email and if they have any questions',
            type: 'follow_up',
            priority: 'medium',
            status: 'pending',
            due_date: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Day 2
            created_at: now.toISOString(),
            updated_at: now.toISOString()
        },
        {
            id: `task-${Date.now()}-2`,
            lead_id: leadId,
            title: `2nd follow-up with ${leadName}`,
            description: 'Send 2nd follow-up email if no response',
            type: 'follow_up',
            priority: 'medium',
            status: 'pending',
            due_date: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(), // Day 5
            created_at: now.toISOString(),
            updated_at: now.toISOString()
        },
        {
            id: `task-${Date.now()}-3`,
            lead_id: leadId,
            title: `Final follow-up or mark ${leadName} as dead`,
            description: 'Send final follow-up email or mark lead as dead if no response',
            type: 'follow_up',
            priority: 'low',
            status: 'pending',
            due_date: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(), // Day 10
            created_at: now.toISOString(),
            updated_at: now.toISOString()
        }
    ];

    const { error } = await supabase
        .from('tasks')
        .insert(tasks);

    if (error) {
        console.error('❌ Error creating follow-up tasks:', error);
        return false;
    }

    console.log(`✅ Created 3 follow-up tasks for ${leadName}`);
    return true;
}
