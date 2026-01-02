const axios = require('axios');

/**
 * Client for the actual Pitch Generator API
 */
async function generatePitchFromAPI(leadContext) {
    // Correcting to the actual API endpoint: /api/generate
    const API_URL = process.env.PITCH_GENERATOR_API_URL || `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/generate`;

    try {
        // Map lead context to the expected format of /api/generate
        // Expected: { targetType, customName, context }
        const payload = {
            targetType: leadContext.industry || 'Prospect',
            customName: leadContext.firstName || leadContext.name || 'there',
            context: JSON.stringify({
                companyName: leadContext.companyName,
                painPoints: leadContext.painPoints,
                businessType: leadContext.businessType,
                ...leadContext
            })
        };

        const response = await axios.post(API_URL, payload);

        if (response.data && response.data.pitch) {
            // Check if it's already divided into subject and body
            // If not, we'll need to parse it or just use it as the body
            const pitchText = response.data.pitch;

            // Simple parsing if AI provides a subject line like "Subject: ..."
            let subject = `Quick question for ${leadContext.companyName || 'you'}`;
            let body = pitchText;

            const subjectMatch = pitchText.match(/Subject:\s*(.*)/i);
            if (subjectMatch) {
                subject = subjectMatch[1];
                body = pitchText.replace(/Subject:\s*.*\n?/i, '').trim();
            }

            return {
                subject: subject,
                bodyPlainText: body,
                bodyHtml: body.replace(/\n/g, '<br>')
            };
        }

        throw new Error('Invalid response from Pitch Generator');
    } catch (error) {
        console.error('Pitch Generator API Error:', error);
        // Fallback to default template if AI fails
        return {
            subject: `Scale your ${leadContext.industry || 'business'} with KrissKross AI`,
            bodyPlainText: `Hi ${leadContext.firstName || 'there'},\n\nI saw what you're doing at ${leadContext.companyName || 'your company'} and thought our AI video tools could help save you 10+ hours a week.`,
            bodyHtml: `<p>Hi ${leadContext.firstName || 'there'},</p><p>I saw what you're doing at <strong>${leadContext.companyName || 'your company'}</strong> and thought our AI video tools could help save you 10+ hours a week.</p>`
        };
    }
}

module.exports = {
    generatePitchFromAPI
};
