/**
 * Exchange Short-Lived Token for Long-Lived Token
 * 
 * Usage: node scripts/exchange-token.js
 */

require('dotenv').config({ path: '.env.local' });
const https = require('https');

const APP_SECRET = process.env.INSTAGRAM_APP_SECRET;

if (!APP_SECRET) {
    console.error('❌ Error: INSTAGRAM_APP_SECRET must be set in .env.local');
    process.exit(1);
}

// Token to exchange (passed as argument or hardcoded for testing - preferably argument)
const SHORT_LIVED_TOKEN = process.argv[2] || 'SHORT_TOKEN_HERE';

// Basic Display API Exchange URL
const BASE_URL = 'https://graph.instagram.com/access_token';

function exchangeToken() {
    const url = `${BASE_URL}?grant_type=ig_exchange_token&client_secret=${APP_SECRET}&access_token=${SHORT_LIVED_TOKEN}`;

    console.log('Exchanging token...');

    https.get(url, (res) => {
        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            try {
                const response = JSON.parse(data);
                if (response.access_token) {
                    console.log('\n✅ SUCCESS! Long-lived token obtained:\n');
                    console.log(response.access_token);
                    console.log('\nExpires in:', response.expires_in, 'seconds');
                    console.log('Token Type:', response.token_type);
                } else {
                    console.error('\n❌ ERROR:', response);
                }
            } catch (e) {
                console.error('Failed to parse response:', e);
                console.log('Raw data:', data);
            }
        });

    }).on('error', (e) => {
        console.error('Request error:', e);
    });
}

exchangeToken();
