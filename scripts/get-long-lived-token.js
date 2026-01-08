/**
 * Exchange Short-Lived Graph API Token for Long-Lived Token
 * 
 * Usage: node scripts/get-long-lived-token.js <SHORT_TOKEN>
 */

require('dotenv').config({ path: '.env.local' });
const https = require('https');

const APP_ID = '1187682906764579';
const APP_SECRET = process.env.INSTAGRAM_APP_SECRET;

if (!APP_SECRET) {
    console.error('❌ Error: INSTAGRAM_APP_SECRET must be set in .env.local');
    process.exit(1);
}

const args = process.argv.slice(2);
const SHORT_TOKEN = args[0];

if (!SHORT_TOKEN) {
    console.error('Please provide the short-lived token as an argument.');
    process.exit(1);
}

const url = `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${APP_ID}&client_secret=${APP_SECRET}&fb_exchange_token=${SHORT_TOKEN}`;

console.log('Exchanging token for long-lived version...');

https.get(url, (res) => {
    let data = '';

    res.on('data', chunk => data += chunk);

    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json.access_token) {
                console.log('\n✅ SUCCESS! Long-lived token obtained (valid for ~60 days):\n');
                console.log(json.access_token);
                console.log(`\nExpires in: ${json.expires_in} seconds`);

                // Output for easy copying
                console.log('\n--- COPY BELOW ---');
                console.log(`INSTAGRAM_ACCESS_TOKEN=${json.access_token}`);
                console.log('------------------\n');
            } else {
                console.error('\n❌ ERROR:', json);
            }
        } catch (e) {
            console.error('Failed to parse response:', e);
        }
    });

}).on('error', e => console.error('Request error:', e));
