/**
 * Instagram Webhook Signature Verification
 * 
 * Verifies incoming webhook requests from Instagram are authentic
 * using HMAC SHA-256 signature validation
 */

import crypto from 'crypto';

/**
 * Verify Instagram webhook signature
 * @param {string} signature - X-Hub-Signature-256 header value (format: "sha256=...")
 * @param {string} payload - Raw request body as string
 * @param {string} appSecret - Instagram App Secret from environment
 * @returns {boolean} - True if signature is valid
 */
export function verifyWebhookSignature(signature, payload, appSecret) {
    if (!signature || !payload || !appSecret) {
        console.error('Missing required parameters for signature verification');
        return false;
    }

    // Extract the signature hash (remove "sha256=" prefix)
    const signatureHash = signature.replace('sha256=', '');

    // Generate expected signature
    const expectedSignature = crypto
        .createHmac('sha256', appSecret)
        .update(payload)
        .digest('hex');

    // Constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
        Buffer.from(signatureHash, 'hex'),
        Buffer.for(expectedSignature, 'hex')
    );
}

/**
 * Handle Facebook webhook verification challenge
 * @param {string} mode - hub.mode parameter
 * @param {string} token - hub.verify_token parameter
 * @param {string} challenge - hub.challenge parameter
 * @param {string} expectedToken - Expected verify token from environment
 * @returns {string|null} - Challenge to echo back, or null if invalid
 */
export function handleVerificationChallenge(mode, token, challenge, expectedToken) {
    if (mode === 'subscribe' && token === expectedToken) {
        console.log('✓ Webhook verification successful');
        return challenge;
    }

    console.error('❌ Webhook verification failed:', { mode, token: token ? '***' : null });
    return null;
}

/**
 * Parse Instagram webhook event payload
 * @param {object} body - Parsed JSON body from webhook request
 * @returns {Array} - Array of Instagram events
 */
export function parseWebhookPayload(body) {
    if (!body || !body.entry) {
        return [];
    }

    const events = [];

    body.entry.forEach(entry => {
        // Handle messaging events (DMs)
        if (entry.messaging) {
            entry.messaging.forEach(messagingEvent => {
                events.push({
                    type: 'message',
                    senderId: messagingEvent.sender?.id,
                    recipientId: messagingEvent.recipient?.id,
                    timestamp: messagingEvent.timestamp,
                    message: messagingEvent.message,
                    event: messagingEvent
                });
            });
        }

        // Handle comment events
        if (entry.changes) {
            entry.changes.forEach(change => {
                if (change.field === 'comments') {
                    events.push({
                        type: 'comment',
                        value: change.value,
                        event: change
                    });
                }

                // Handle mentions
                if (change.field === 'mentions') {
                    events.push({
                        type: 'mention',
                        value: change.value,
                        event: change
                    });
                }
            });
        }
    });

    return events;
}

export default {
    verifyWebhookSignature,
    handleVerificationChallenge,
    parseWebhookPayload
};
