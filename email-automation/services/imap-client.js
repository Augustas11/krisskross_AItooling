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
            markSeen: false
        };
        // Note: For full robustness we'd fetch bodies: [''] to get everything,
        // but 'TEXT' often suffices if we parse it right. 
        // However, 'TEXT' in Multipart emails might be the raw boundary.
        // Let's stick to 'HEADER' and 'TEXT' but try to parse the TEXT part as quoted-printable if needed.
        // ACTUALLY, to fix the specific content-type garbage, we need to parse the content.
        // Let's try to decode the preview.

        // REVISION: The best way to fix this is to use MAILPARSER on the body.
        // But we need the headers + body for mailparser to work best.
        // Let's fetch the full source.
        const fetchOptions = {
            bodies: [''], // Fetch full source
            markSeen: false
        };

        const messages = await connection.search(searchCriteria, fetchOptions);
        console.log(`📥 Found ${messages.length} unread messages.`);

        return await processMessagesWithParser(messages);

    } catch (error) {
        console.error('❌ IMAP Error:', error);
        throw error;
    } finally {
        if (connection) {
            connection.end();
        }
    }
}

async function processMessagesWithParser(messages) {
    const results = [];

    for (const item of messages) {
        try {
            // imap-simple returns parts. If we requested [''], it comes as parts[0].
            const allPart = item.parts.find(p => p.which === '');
            const uid = item.attributes.uid;

            if (allPart) {
                // Parse full source
                const parsed = await simpleParser(allPart.body);

                results.push({
                    uid: uid,
                    from: parsed.from ? parsed.from.text : '',
                    subject: parsed.subject,
                    date: parsed.date,
                    messageId: parsed.messageId,
                    inReplyTo: parsed.inReplyTo,
                    // Use text body, fallback to html, or empty
                    preview: (parsed.text || parsed.html || '').substring(0, 200).replace(/\n/g, ' ').trim()
                });
            } else {
                // Fallback if something went wrong (shouldn't if we ask for '')
                console.warn(`⚠️ No body found for msg ${uid}`);
            }

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
