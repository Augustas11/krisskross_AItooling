/**
 * Check Token Validity and Type
 * 
 * Usage: node scripts/check-token.js
 */

const https = require('https');

const APP_ID = '1187682906764579';
const APP_SECRET = '24cdcf261b0cbbacac0063638c0ecef6';
const TOKEN = 'IGAAQ4MPnDdSNBZAGFvSThQR0xQd21UejBDRkJ1SzhyUGZAHZAjdiVFl5T0J3b1ItN3JCa29ubXFqMFg0TWJiazZAhcWVuOXhmUF84eDFpYWprZAnFvZAjNPUWhfQkoxVTdQNWVaT3NOUXFUVUZAFTDRNMlFGeWV0YXFrS1NCTXpScnBtawZDZD';

function makeRequest(label, url) {
    console.log(`\nTesting ${label}...`);
    console.log(`URL: ${url}`);

    https.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            try {
                const json = JSON.parse(data);
                if (json.error) {
                    console.log(`❌ ${label} Failed:`, json.error.message);
                } else {
                    console.log(`✅ ${label} Success!`, JSON.stringify(json, null, 2));
                }
            } catch (e) {
                console.log(`⚠️ ${label} parsing error:`, data);
            }
        });
    }).on('error', (e) => {
        console.error(`Request error for ${label}:`, e.message);
    });
}

// 1. Test against Basic Display API /me
makeRequest(
    'Basic Display /me',
    `https://graph.instagram.com/me?fields=id,username,account_type&access_token=${TOKEN}`
);

// 2. Test against Facebook Graph API /me (to see if it works there)
makeRequest(
    'Graph API /me',
    `https://graph.facebook.com/v21.0/me?access_token=${TOKEN}`
);

// 3. Test Exchange via Facebook Endpoint (just in case)
makeRequest(
    'FB Exchange',
    `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${APP_ID}&client_secret=${APP_SECRET}&fb_exchange_token=${TOKEN}`
);
