
import { researchLead } from '../lib/perplexity.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function runTest() {
    console.log('--- TESTING PERPLEXITY INTEGRATION ---');

    // Test Case: PINSPARK
    const lead = {
        name: 'PINSPARK',
        website: 'pinspark.com',
    };

    try {
        console.log(`Researching ${lead.name}...`);
        const result = await researchLead(lead);

        console.log('\n--- FORMATTED SUMMARY (Will affect UI) ---');
        if (result && result.summary) {
            console.log(result.summary);
        } else {
            console.log('No summary returned.');
        }

        console.log('\n--- RAW DATA ---');
        console.log(JSON.stringify(result, null, 2));

    } catch (error) {
        console.error('Test Failed:', error);
    }
}

runTest();
