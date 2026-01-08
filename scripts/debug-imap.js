require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const imaps = require('imap-simple');
const simpleParser = require('mailparser').simpleParser;

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function debugImap() {
    const config = {
        imap: {
            user: process.env.EMAIL_ADDRESS,
            password: process.env.EMAIL_PASSWORD,
            host: process.env.IMAP_HOST,
            port: parseInt(process.env.IMAP_PORT || '993'),
            tls: process.env.IMAP_TLS === 'true',
            authTimeout: 3000
        }
    };

    console.log(`🔌 Connecting to IMAP: ${config.imap.user} at ${config.imap.host}:${config.imap.port}...`);

    try {
        const connection = await imaps.connect(config);
        console.log('✅ Connected to IMAP');

        await connection.openBox('INBOX');
        console.log('📂 Opened INBOX');

        // Fetch last 10 emails headers to see what's there
        const searchCriteria = [['ALL']]; // Get all to be sure, or a slice
        const fetchOptions = {
            bodies: ['HEADER'],
            markSeen: false,
            struct: true
        };

        // Get count first
        // imap-simple doesn't have easy count, just search.

        console.log('🔍 Searching for recent emails...');
        const messages = await connection.search(searchCriteria, fetchOptions);

        console.log(`Found ${messages.length} total messages in Inbox.`);

        // Let's look at the last 5 messages
        const recentMessages = messages.slice(-5);

        for (const message of recentMessages) {
            const header = message.parts.find(part => part.which === 'HEADER');
            // header.body is the raw header object
            console.log('---------------------------------------------------');
            console.log('Subject:', header.body.subject[0]);
            console.log('From:', header.body.from[0]);
            console.log('To:', header.body.to ? header.body.to[0] : 'N/A');
            console.log('Date:', header.body.date[0]);
            console.log('UID:', message.attributes.uid);
            console.log('Flags:', message.attributes.flags);
        }

        connection.end();
    } catch (e) {
        console.error('❌ IMAP Error:', e);
    }
}

debugImap();
