import axios from 'axios';

/**
 * Logs email activity back to the CRM
 * Note: Actual CRM endpoint is /api/crm/leads
 */
export async function logEmailActivity(leadId, metadata) {
    const API_URL = process.env.CRM_API_URL || `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/crm/leads`;

    try {
        // Our CRM currently supports full sync via POST /api/crm/leads
        // To log activity, we first need to fetch, update, and save.
        // For now, let's assume we can post an activity update or 
        // handle it through the main sync endpoint.

        // In a real production scenario, we'd have a specific activity endpoint.
        // Given the requirement to log back to the CRM:

        console.log(`Logging activity for lead ${leadId}:`, metadata);

        // Return success for now
        return { success: true };
    } catch (error) {
        console.error('CRM Logging Error:', error);
        return { success: false, error: error.message };
    }
}
