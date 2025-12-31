const imaps = require('imap-simple');
const simpleParser = require('mailparser').simpleParser;

function getConfig() {
    return {
        imap: {
            user: process.env.IMAP_USER || process.env.EMAIL_ADDRESS,
            password: process.env.IMAP_PASSWORD || process.env.EMAIL_PASSWORD,
            host: process.env.IMAP_HOST || 'imap.titan.email',
            port: parseInt(process.env.IMAP_PORT || '993'),
            tls: process.env.IMAP_TLS !== 'false',
            tlsOptions: { rejectUnauthorized: false },
            authTimeout: 10000
        }
    };
}

/**
 * Connects to IMAP, searches for unread emails, and parses them.
 * @returns {Promise<Array>} List of parsed email objects
 */
async function getUnreadReplies() {
    let connection;
    try {
        const config = getConfig();
        // Enable raw protocol logging
        // config.imap.debug = (msg) => console.log(`[IMAP RAW] ${msg}`);

        console.log(`🔌 Connecting to IMAP as ${config.imap.user}...`);
        connection = await imaps.connect(config);

        await connection.openBox('INBOX');

        const searchCriteria = ['UNSEEN'];
        const fetchOptions = {
            bodies: ['HEADER', 'TEXT'],
            markSeen: false // Don't mark as seen until processed
        };

        const messages = await connection.search(searchCriteria, fetchOptions);
        console.log(`📥 Found ${messages.length} unread messages.`);

        const parsedEmails = [];

        for (const message of messages) {
            const all = message.parts.find(part => part.which === 'TEXT');
            const id = message.attributes.uid;
            const idHeader = "Imap-Id: " + id + "\r\n";

            // Simple parsing to get basic info
            // For robust parsing we ideally use mailparser on the stream, but 'imap-simple' provides parts.
            // Let's use the helper to get the full body if possible or just headers for matching.
            // Actually, imap-simple's `getParts` is needed for full body.
            // Simpler approach: match by header first.

            // Let's fetch the full message source for mailparser to handle complexities
            // Rearchitecting fetch options slightly to get full body for parsing
        }

        // Re-implementing search to work better with mailparser
        // We need the full source to parse reliably
        return await processMessagesWithParser(messages, connection);

    } catch (error) {
        console.error('❌ IMAP Error:', error);
        throw error;
    } finally {
        if (connection) {
            connection.end();
        }
    }
}

async function processMessagesWithParser(messages, connection) {
    const results = [];

    for (const item of messages) {
        try {
            const bodyPart = item.parts.find(part => part.which === 'TEXT');
            const headerPart = item.parts.find(part => part.which === 'HEADER');

            // Note: imap-simple splits header and body. 
            // For simple Reply detection, we mostly need From, Subject, Date, and Snippet.

            // Let's construct a simple object from headers
            const headers = headerPart.body;
            const from = headers.from ? headers.from[0] : '';
            const subject = headers.subject ? headers.subject[0] : '';
            const msgId = headers['message-id'] ? headers['message-id'][0] : '';
            const inReplyTo = headers['in-reply-to'] ? headers['in-reply-to'][0] : null;

            // Extract email address from "Name <email@domain.com>"
            const emailMatch = from.match(/<(.+)>/);
            const senderEmail = emailMatch ? emailMatch[1] : from.trim();

            results.push({
                uid: item.attributes.uid,
                from: senderEmail,
                rawFrom: from,
                subject: subject,
                date: item.attributes.date,
                inReplyTo: inReplyTo,
                messageId: msgId,
                preview: bodyPart ? bodyPart.body.substring(0, 200) : ''
            });

        } catch (err) {
            console.error('Error parsing message:', err);
        }
    }

    return results;
}

async function markEmailAsSeen(uid) {
    let connection;
    try {
        const config = getConfig(); // Fix: Get config
        connection = await imaps.connect(config);
        await connection.openBox('INBOX');
        await connection.addFlags(uid, ['\\Seen']);
        console.log(`👀 Marked email ${uid} as seen.`);
    } catch (error) {
        console.error('Error marking as seen:', error);
    } finally {
        if (connection) connection.end();
    }
}


module.exports = {
    getUnreadReplies,
    markEmailAsSeen
};
