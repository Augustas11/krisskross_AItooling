/**
 * Validate App Credentials
 * 
 * Checks if the App ID and App Secret are valid by making a Server-to-Server API call.
 * This helps diagnose if Error 101 is caused by an invalid App Secret.
 */

require('dotenv').config({ path: '.env.local' });
const https = require('https');

const APP_ID = process.env.INSTAGRAM_APP_ID;
const APP_SECRET = process.env.INSTAGRAM_APP_SECRET;

if (!APP_ID || !APP_SECRET) {
    console.error('❌ Error: INSTAGRAM_APP_ID and INSTAGRAM_APP_SECRET must be set in .env.local');
    process.exit(1);
}

function validateCredentials() {
    console.log('Testing App Credentials...');

    // We use the "App Token" (AppID|AppSecret) to call the inspection endpoint
    // If the secret is wrong, this call will fail.
    const appToken = `${APP_ID}|${APP_SECRET}`;

    // Just checking "me" with the App Token or debugging the token itself
    const url = `https://graph.facebook.com/v21.0/app?access_token=${appToken}`;

    https.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            try {
                const json = JSON.parse(data);
                if (json.error) {
                    console.log('\n❌ App Secret seems INVALID or Restricted.');
                    console.log('Error:', json.error.message);
                    console.log('Code:', json.error.code);
                } else {
                    console.log('\n✅ App Credentials are VALID.');
                    console.log('App Name:', json.name);
                    console.log('App ID:', json.id);
                }
            } catch (e) {
                console.error('Parse error:', e);
            }
        });
    }).on('error', e => console.error('Connection error:', e));
}

validateCredentials();
