/**
 * Exchange Short-Lived Token for Long-Lived Token
 * 
 * Usage: node scripts/exchange-token.js
 */

const https = require('https');

const APP_SECRET = '24cdcf261b0cbbacac0063638c0ecef6';
const SHORT_LIVED_TOKEN = 'IGAAQ4MPnDdSNBZAGFvSThQR0xQd21UejBDRkJ1SzhyUGZAHZAjdiVFl5T0J3b1ItN3JCa29ubXFqMFg0TWJiazZAhcWVuOXhmUF84eDFpYWprZAnFvZAjNPUWhfQkoxVTdQNWVaT3NOUXFUVUZAFTDRNMlFGeWV0YXFrS1NCTXpScnBtawZDZD';

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
