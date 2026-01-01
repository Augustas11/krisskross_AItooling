
const { ApifyClient } = require('apify-client');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function testApify() {
    const token = process.env.APIFY_API_TOKEN;
    if (!token) {
        console.error('❌ NO APIFY_API_TOKEN FOUND in .env.local');
        return;
    }
    console.log('✅ Found APIFY_API_TOKEN provided (length: ' + token.length + ')');

    const client = new ApifyClient({ token });

    console.log('🔄 Testing Instagram Scraper (handling: "instagram")...');

    try {
        console.log('Testing handle: dokotoo_official');
        const run = await client.actor('apify/instagram-profile-scraper').call({
            usernames: ['dokotoo_official'],
            proxy: { useApifyProxy: true }
        });

        console.log('✅ Run started, ID:', run.id);
        const { items } = await client.dataset(run.defaultDatasetId).listItems();

        if (items.length > 0) {
            console.log('✅ Scrape Success!');
            console.log('Full Item:', JSON.stringify(items[0], null, 2));
        } else {
            console.error('❌ Scrape completed but returned 0 items.');
        }

    } catch (e) {
        console.error('❌ APIFY ERROR:', e.message);
    }
}

testApify();
