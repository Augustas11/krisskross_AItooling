const axios = require('axios');

/**
 * Finds a lead by email address
 * Uses the GET /api/crm/leads endpoint and filters locally
 */
async function findLeadByEmail(email) {
    const API_URL = process.env.CRM_API_URL || 'http://localhost:3000/api/crm/leads';

    try {
        console.log(`🔎 Searching for lead with email: ${email}`);
        const response = await axios.get(API_URL);

        if (!response.data || !response.data.leads) {
            console.log('⚠️ No leads found in CRM');
            return null;
        }

        const leads = response.data.leads;

        // Normalize email for comparison
        const targetEmail = email.toLowerCase().trim();

        const lead = leads.find(l => l.email && l.email.toLowerCase().trim() === targetEmail);

        if (lead) {
            console.log(`✅ Found lead: ${lead.name} (${lead.id})`);
            return lead;
        } else {
            console.log('❌ No matching lead found.');
            return null;
        }
    } catch (error) {
        console.error('❌ Error finding lead:', error.message);
        return null;
    }
}

/**
 * Updates a lead's status
 * Uses the PUT /api/crm/leads endpoint for a single lead update
 */
async function updateLeadStatus(leadId, newStatus) {
    const API_URL = process.env.CRM_API_URL || 'http://localhost:3000/api/crm/leads';

    try {
        // 1. Fetch the lead first to get current data
        const getResponse = await axios.get(API_URL);
        if (!getResponse.data || !getResponse.data.leads) {
            throw new Error('Could not fetch leads for update');
        }

        const lead = getResponse.data.leads.find(l => l.id === leadId);

        if (!lead) {
            throw new Error(`Lead ${leadId} not found`);
        }

        // 2. Update the specific lead
        // Only update if status is different
        if (lead.status === newStatus) {
            console.log(`ℹ️ Lead ${leadId} already has status: ${newStatus}`);
            return { success: true };
        }

        const updatedLead = {
            ...lead,
            status: newStatus,
            lastInteraction: new Date().toISOString()
        };

        // 3. Send update via PUT
        console.log(`🔄 Updating lead ${leadId} status to "${newStatus}" via PUT...`);
        await axios.put(API_URL, { lead: updatedLead });

        console.log(`✅ Successfully updated lead status.`);
        return { success: true };

    } catch (error) {
        console.error('❌ Error updating lead status:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Logs email activity back to the CRM
 * Note: Actual CRM endpoint is /api/crm/leads
 */
async function logEmailActivity(leadId, metadata) {
    // For now, we will just log to console as we rely on status updates.
    // In a future robust implementation, we would append to an 'activities' array on the lead object.
    console.log(`📝 [ACTIVITY LOG] Lead: ${leadId}`, metadata);
    return { success: true };
}

module.exports = {
    findLeadByEmail,
    updateLeadStatus,
    logEmailActivity
};
