const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const SHORT_LIVED_TOKEN = process.argv[2];

if (!SHORT_LIVED_TOKEN) {
    console.error('❌ Please provide the short-lived token as an argument');
    console.log('Usage: node scripts/exchange-token.js <short-token>');
    process.exit(1);
}

const APP_ID = process.env.INSTAGRAM_APP_ID || process.env.FACEBOOK_APP_ID;
const APP_SECRET = process.env.INSTAGRAM_APP_SECRET || process.env.FACEBOOK_APP_SECRET;

async function exchangeToken() {
    console.log('🔄 Exchanging short-lived token for long-lived token...');

    if (!APP_ID || !APP_SECRET) {
        console.error('❌ Missing App ID or App Secret in .env.local');
        process.exit(1);
    }

    const url = `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${APP_ID}&client_secret=${APP_SECRET}&fb_exchange_token=${SHORT_LIVED_TOKEN}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            console.error('❌ Token Exchange Error:', data.error);
            return;
        }

        const longLivedToken = data.access_token;
        const expiresIn = data.expires_in; // Seconds

        console.log('✅ Success! Generated Long-Lived Token.');
        console.log('Expires in:', Math.round(expiresIn / 86400), 'days');

        // Update .env.local
        const envPath = path.join(process.cwd(), '.env.local');
        let envContent = fs.readFileSync(envPath, 'utf8');

        // Replace or Append
        if (envContent.includes('INSTAGRAM_ACCESS_TOKEN=')) {
            envContent = envContent.replace(
                /INSTAGRAM_ACCESS_TOKEN=.*/,
                `INSTAGRAM_ACCESS_TOKEN=${longLivedToken}`
            );
        } else {
            envContent += `\nINSTAGRAM_ACCESS_TOKEN=${longLivedToken}\n`;
        }

        fs.writeFileSync(envPath, envContent);
        console.log('✅ Updated .env.local with new token');

        // Now run the setup script to update DB
        console.log('🔄 Updating Supabase Database...');

        // We need to reload env to get the new token in process.env for the next script
        process.env.INSTAGRAM_ACCESS_TOKEN = longLivedToken;

        require('./setup-instagram-credentials.js');

    } catch (error) {
        console.error('❌ Network or Script Error:', error);
    }
}

exchangeToken();
