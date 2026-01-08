/**
 * Check Token Validity and Type
 * 
 * Usage: node scripts/check-token.js
 */

require('dotenv').config({ path: '.env.local' });
const https = require('https');

const APP_ID = '1187682906764579';
const APP_SECRET = process.env.INSTAGRAM_APP_SECRET;

if (!APP_SECRET) {
    console.error('❌ Error: INSTAGRAM_APP_SECRET must be set in .env.local');
    process.exit(1);
}

const TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN || 'TOKEN_NOT_SET';

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
