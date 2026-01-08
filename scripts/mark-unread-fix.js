require('dotenv').config({ path: '.env.local' });
const imaps = require('imap-simple');

async function markUnread() {
    const config = {
        imap: {
            user: process.env.EMAIL_ADDRESS,
            password: process.env.EMAIL_PASSWORD,
            host: process.env.IMAP_HOST || 'imap.titan.email',
            port: parseInt(process.env.IMAP_PORT || '993'),
            tls: process.env.IMAP_TLS !== 'false',
            authTimeout: 10000
        }
    };

    console.log(`🔌 Connecting to IMAP...`);
    try {
        const connection = await imaps.connect(config);
        console.log('✅ Connected');
        await connection.openBox('INBOX');

        const uid = 147; // The reply email UID identified in previous step
        await connection.delFlags(uid, ['\\Seen']);
        console.log(`✅ Marked UID ${uid} as UNSEEN (Unread)`);

        connection.end();
    } catch (e) {
        console.error('Error:', e);
    }
}

markUnread();
