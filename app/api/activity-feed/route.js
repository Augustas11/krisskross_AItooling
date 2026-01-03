import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

/**
 * GET /api/activity-feed
 * 
 * Fetch activity feed with filtering and pagination
 * 
 * Query Parameters:
 * - entityId: Filter by specific entity (e.g., lead ID)
 * - entityType: Filter by entity type (lead, deal, contact)
 * - actorId: Filter by actor (user) - "My Activity"
 * - actionType: Filter by action type (lead, email, pitch, status_change, meeting)
 * - timeRange: today, week, month, all (default: all)
 * - cursor: Timestamp for cursor-based pagination
 * - limit: Number of records to return (default: 20, max: 100)
 */
export async function GET(req) {
    console.log('📥 [API] GET /api/activity-feed');

    if (!isSupabaseConfigured()) {
        console.log('⚠️ [API] Supabase not configured');
        return NextResponse.json({ data: [], nextCursor: null });
    }

    try {
        const { searchParams } = new URL(req.url);

        // Extract query parameters
        const entityId = searchParams.get('entityId');
        const entityType = searchParams.get('entityType');
        const actorId = searchParams.get('actorId');
        const actionType = searchParams.get('actionType');
        const timeRange = searchParams.get('timeRange') || 'all';
        const cursor = searchParams.get('cursor');
        const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

        console.log('🔍 [API] Filters:', { entityId, entityType, actorId, actionType, timeRange, cursor, limit });

        // Build query
        let query = supabase
            .from('activity_feed')
            .select('*');

        // Apply filters
        if (entityId) {
            query = query.eq('entity_id', entityId);
        }

        if (entityType) {
            query = query.eq('entity_type', entityType);
        }

        if (actorId) {
            if (actorId === 'system') {
                query = query.is('actor_id', null);
            } else {
                query = query.eq('actor_id', actorId);
            }
        }

        if (actionType) {
            query = query.eq('action_type', actionType);
        }

        // Time range filtering
        if (timeRange !== 'all') {
            const now = new Date();
            let startDate;

            switch (timeRange) {
                case 'today':
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    break;
                case 'week':
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case 'month':
                    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    break;
            }

            if (startDate) {
                query = query.gte('created_at', startDate.toISOString());
            }
        }

        // Cursor-based pagination (for infinite scroll)
        if (cursor) {
            query = query.lt('created_at', cursor);
        }

        // Order and limit
        query = query
            .order('created_at', { ascending: false })
            .limit(limit);

        // Execute query
        const { data, error } = await query;

        if (error) {
            console.error('❌ [API] Error fetching activity feed:', error);
            throw error;
        }

        // Determine next cursor
        const nextCursor = data.length > 0 ? data[data.length - 1].created_at : null;

        console.log(`✅ [API] Fetched ${data.length} activities`);

        return NextResponse.json({
            data,
            nextCursor,
            hasMore: data.length === limit
        });

    } catch (error) {
        console.error('❌ [API] Error in activity feed endpoint:', error);
        return NextResponse.json(
            { error: error.message, data: [], nextCursor: null },
            { status: 500 }
        );
    }
}

/**
 * POST /api/activity-feed
 * 
 * Manually create an activity (for custom events)
 * 
 * Body:
 * {
 *   actorId: string (optional),
 *   actorName: string,
 *   actionVerb: string,
 *   actionType: string,
 *   entityType: string,
 *   entityId: string,
 *   entityName: string,
 *   metadata: object,
 *   priority: number (0-10)
 * }
 */
export async function POST(req) {
    console.log('💾 [API] POST /api/activity-feed');

    if (!isSupabaseConfigured()) {
        return NextResponse.json(
            { error: 'Supabase not configured' },
            { status: 503 }
        );
    }

    try {
        const body = await req.json();

        // Validate required fields
        const requiredFields = ['actorName', 'actionVerb', 'actionType', 'entityType', 'entityId'];
        for (const field of requiredFields) {
            if (!body[field]) {
                return NextResponse.json(
                    { error: `Missing required field: ${field}` },
                    { status: 400 }
                );
            }
        }

        // Insert activity
        const activityRecord = {
            actor_id: body.actorId || null,
            actor_name: body.actorName,
            action_verb: body.actionVerb,
            action_type: body.actionType,
            entity_type: body.entityType,
            entity_id: body.entityId,
            entity_name: body.entityName || null,
            metadata: body.metadata || {},
            is_aggregated: false,
            priority: body.priority || 0,
            visibility: body.visibility || 'team',
            first_occurred_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('activity_feed')
            .insert(activityRecord)
            .select()
            .single();

        if (error) {
            console.error('❌ [API] Error creating activity:', error);
            throw error;
        }

        console.log('✅ [API] Activity created:', data.id);

        return NextResponse.json({ data });

    } catch (error) {
        console.error('❌ [API] Error creating activity:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/activity-feed
 * 
 * Mark activities as read
 * 
 * Body:
 * {
 *   activityIds: string[] - Array of activity IDs to mark as read
 * }
 */
export async function PATCH(req) {
    console.log('📝 [API] PATCH /api/activity-feed (Mark as read)');

    if (!isSupabaseConfigured()) {
        return NextResponse.json(
            { error: 'Supabase not configured' },
            { status: 503 }
        );
    }

    try {
        const body = await req.json();

        if (!body.activityIds || !Array.isArray(body.activityIds)) {
            return NextResponse.json(
                { error: 'Missing or invalid activityIds array' },
                { status: 400 }
            );
        }

        const { error } = await supabase
            .from('activity_feed')
            .update({ is_read: true })
            .in('id', body.activityIds);

        if (error) {
            console.error('❌ [API] Error marking activities as read:', error);
            throw error;
        }

        console.log(`✅ [API] Marked ${body.activityIds.length} activities as read`);

        return NextResponse.json({ message: 'Activities marked as read' });

    } catch (error) {
        console.error('❌ [API] Error marking activities as read:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
