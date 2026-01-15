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
 * Connects to IMAP, searches for ALL emails from the last N days, and parses them.
 * This allows detecting replies even if they were already marked as read.
 * @param {number} daysBack - How many days back to search (default: 7)
 * @returns {Promise<Array>} List of parsed email objects
 */
async function getAllRecentEmails(daysBack = 7) {
    let connection;
    try {
        const config = getConfig();
        console.log(`🔌 Connecting to IMAP as ${config.imap.user}...`);
        connection = await imaps.connect(config);

        await connection.openBox('INBOX');

        // Calculate date N days ago
        const sinceDate = new Date();
        sinceDate.setDate(sinceDate.getDate() - daysBack);
        const dateString = sinceDate.toISOString().split('T')[0]; // YYYY-MM-DD format

        // Search for ALL emails since that date (not just UNSEEN)
        const searchCriteria = [['SINCE', dateString]];
        const fetchOptions = {
            bodies: [''], // Fetch full source
            markSeen: false
        };

        const messages = await connection.search(searchCriteria, fetchOptions);
        console.log(`📥 Found ${messages.length} emails from the last ${daysBack} days.`);

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

/**
 * Legacy function - searches for unread emails only
 * @deprecated Use getAllRecentEmails instead for better reply detection
 * @returns {Promise<Array>} List of parsed email objects
 */
async function getUnreadReplies() {
    let connection;
    try {
        const config = getConfig();
        console.log(`🔌 Connecting to IMAP as ${config.imap.user}...`);
        connection = await imaps.connect(config);

        await connection.openBox('INBOX');

        const searchCriteria = ['UNSEEN'];
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
            const flags = item.attributes.flags || [];

            if (allPart) {
                // Parse full source
                const parsed = await simpleParser(allPart.body);

                results.push({
                    uid: uid,
                    from: parsed.from ? parsed.from.text : '',
                    fromAddress: parsed.from?.value?.[0]?.address || '',
                    subject: parsed.subject,
                    date: parsed.date,
                    messageId: parsed.messageId,
                    inReplyTo: parsed.inReplyTo,
                    references: parsed.references,
                    isRead: flags.includes('\\Seen'),
                    // Use text body, fallback to html, or empty
                    preview: (parsed.text || parsed.html || '').substring(0, 200).replace(/\n/g, ' ').trim()
                });
            } else {
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
        const config = getConfig();
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
    getAllRecentEmails,
    markEmailAsSeen
};
