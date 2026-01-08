
import { scanForSocials } from '../lib/scrapers/site-scanner.js';

async function runTest() {
    console.log('--- TESTING SITE SCANNER ---');

    const targets = [
        'outerknown.com',
        'https://allbirds.com',
        'https://glossier.com' // Usually has social links
    ];

    for (const url of targets) {
        console.log(`\nScanning: ${url}`);
        const result = await scanForSocials(url);
        console.log('Result:', JSON.stringify(result, null, 2));
    }
}

runTest();
