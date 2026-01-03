import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import crypto from 'crypto';

/**
 * Emit an activity event to the feed
 * 
 * @param {Object} event - Event payload
 * @param {string} event.actorId - User ID (null for system events)
 * @param {string} event.actorName - User name or 'System'
 * @param {string} event.actionVerb - created, sent, updated, scheduled, enriched, moved, generated, replied, won, lost
 * @param {string} event.actionType - lead, email, pitch, status_change, meeting, deal
 * @param {string} event.entityType - lead, deal, contact
 * @param {string} event.entityId - Entity ID
 * @param {string} event.entityName - Entity display name
 * @param {Object} event.metadata - Additional context (subject, recipient, old_status, new_status, etc.)
 * @param {number} event.priority - 0-10 (default 0)
 * @param {string} event.visibility - 'private', 'team', 'public' (default 'team')
 * @returns {Promise<void>}
 */
export async function emitActivity(event) {
    // Skip if Supabase not configured
    if (!isSupabaseConfigured()) {
        console.log('⚠️ [ACTIVITY] Supabase not configured, skipping activity emission');
        return;
    }

    try {
        // Validate required fields
        if (!event.actionVerb || !event.actionType || !event.entityType || !event.entityId) {
            console.error('❌ [ACTIVITY] Missing required fields:', event);
            return;
        }

        // Generate aggregation key (30-minute time window)
        const timeWindow = Math.floor(Date.now() / (30 * 60 * 1000)); // 30 min buckets
        const aggregationKey = generateAggregationKey({
            actorId: event.actorId,
            entityId: event.entityId,
            actionVerb: event.actionVerb,
            timeWindow
        });

        // Check if event should be aggregated
        const shouldAggregate = isAggregatableAction(event.actionVerb);

        if (shouldAggregate) {
            // Check for existing aggregated entry
            const { data: existing, error: fetchError } = await supabase
                .from('activity_feed')
                .select('id, aggregated_count, metadata')
                .eq('aggregation_key', aggregationKey)
                .eq('is_aggregated', true)
                .maybeSingle();

            if (fetchError) {
                console.error('❌ [ACTIVITY] Error checking for existing activity:', fetchError);
            }

            if (existing) {
                // Update existing aggregated entry
                const mergedMetadata = mergeMetadata(existing.metadata, event.metadata);

                const { error: updateError } = await supabase
                    .from('activity_feed')
                    .update({
                        aggregated_count: existing.aggregated_count + 1,
                        metadata: mergedMetadata,
                        created_at: new Date().toISOString() // Bump to top of feed
                    })
                    .eq('id', existing.id);

                if (updateError) {
                    console.error('❌ [ACTIVITY] Error updating aggregated activity:', updateError);
                } else {
                    console.log(`✅ [ACTIVITY] Aggregated: ${event.actionVerb} ${event.actionType} (count: ${existing.aggregated_count + 1})`);
                }
                return;
            }
        }

        // Insert new activity
        const activityRecord = {
            actor_id: event.actorId || null,
            actor_name: event.actorName || 'System',
            action_verb: event.actionVerb,
            action_type: event.actionType,
            entity_type: event.entityType,
            entity_id: event.entityId,
            entity_name: event.entityName || null,
            metadata: event.metadata || {},
            aggregation_key: shouldAggregate ? aggregationKey : null,
            is_aggregated: shouldAggregate,
            first_occurred_at: new Date().toISOString(),
            priority: event.priority || 0,
            visibility: event.visibility || 'team'
        };

        const { error: insertError } = await supabase
            .from('activity_feed')
            .insert(activityRecord);

        if (insertError) {
            console.error('❌ [ACTIVITY] Error inserting activity:', insertError);
        } else {
            console.log(`✅ [ACTIVITY] Emitted: ${event.actorName} ${event.actionVerb} ${event.actionType}: ${event.entityName}`);
        }

    } catch (error) {
        console.error('❌ [ACTIVITY] Unexpected error:', error);
    }
}

/**
 * Generate aggregation key for grouping similar actions
 */
function generateAggregationKey({ actorId, entityId, actionVerb, timeWindow }) {
    const keyString = `${actorId || 'system'}-${entityId}-${actionVerb}-${timeWindow}`;
    return crypto
        .createHash('md5')
        .update(keyString)
        .digest('hex');
}

/**
 * Determine if action should be aggregated
 * @param {string} actionVerb - Action verb
 * @returns {boolean}
 */
function isAggregatableAction(actionVerb) {
    // Aggregate repetitive actions (updates, views, tags)
    const aggregateableActions = ['updated', 'viewed', 'tagged'];
    return aggregateableActions.includes(actionVerb);
}

/**
 * Merge metadata from multiple aggregated events
 * @param {Object} existingMetadata - Existing metadata
 * @param {Object} newMetadata - New metadata to merge
 * @returns {Object} Merged metadata
 */
function mergeMetadata(existingMetadata, newMetadata) {
    // Combine field updates, preserve history
    const merged = {
        ...existingMetadata,
        ...newMetadata
    };

    // Merge field_changes arrays if both exist
    if (existingMetadata.field_changes && newMetadata.field_changes) {
        merged.field_changes = [
            ...existingMetadata.field_changes,
            ...newMetadata.field_changes
        ];
    } else if (newMetadata.field_changes) {
        merged.field_changes = newMetadata.field_changes;
    }

    // Merge fields_updated arrays if both exist (deduplicate)
    if (existingMetadata.fields_updated && newMetadata.fields_updated) {
        merged.fields_updated = Array.from(new Set([
            ...existingMetadata.fields_updated,
            ...newMetadata.fields_updated
        ]));
    } else if (newMetadata.fields_updated) {
        merged.fields_updated = newMetadata.fields_updated;
    }

    return merged;
}

/**
 * Helper function to format activity for display
 * @param {Object} activity - Activity record from database
 * @returns {string} Human-readable activity description
 */
export function formatActivityDescription(activity) {
    const { actor_name, action_verb, action_type, entity_name, aggregated_count } = activity;

    if (aggregated_count > 1) {
        return `${actor_name} ${action_verb} ${aggregated_count} ${action_type}s on ${entity_name}`;
    }

    return `${actor_name} ${action_verb} ${action_type}: ${entity_name}`;
}
