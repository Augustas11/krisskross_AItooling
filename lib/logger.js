import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

/**
 * Logs a user activity to the database.
 * @param {string} actionType - The type of action (e.g., 'login', 'view_lead', 'edit_lead')
 * @param {string} resourceType - The type of resource being acted upon (e.g., 'lead', 'user', 'setting')
 * @param {string} resourceId - The ID of the resource
 * @param {object} details - Additional context or changed data
 */
export async function logActivity(actionType, resourceType, resourceId, details = {}) {
    try {
        const session = await getSession();

        // Even if no session (e.g., system action or failed login), we might want to log if we have a user_id context
        // But for now, we rely on session
        const userId = session?.userId || null;

        if (!userId) {
            // Optionally log anonymous actions if needed, or skip
            // console.log('Skipping log for anonymous user:', actionType);
            return;
        }

        const { error } = await supabase.from('user_activity_logs').insert({
            user_id: userId,
            action_type: actionType,
            resource_type: resourceType,
            resource_id: resourceId,
            details: details,
            // ip_address and user_agent would typically come from request headers, 
            // passed down or extracted here if using headers()
        });

        if (error) {
            console.error('Failed to log activity:', error);
        }
    } catch (err) {
        console.error('Error in logActivity:', err);
    }
}
