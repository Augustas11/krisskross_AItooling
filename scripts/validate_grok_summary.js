
import { researchLeadWithGrok } from '../lib/grok.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function runTest() {
    console.log('--- TESTING GROK SUMMARY GENERATION ---');

    // Test Case: PINSPARK (from user screenshot)
    const lead = {
        name: 'PINSPARK',
        website: 'pinspark.com', // Assuming website from context or letting Grok find it if unknown
        // Providing specific context to ensure Grok runs
    };

    try {
        console.log(`Researching ${lead.name}...`);
        const result = await researchLeadWithGrok(lead);

        console.log('\n--- RESULT ---');
        if (result) {
            console.log('Summary Start:');
            console.log(result.summary);
            console.log('Summary End');
            console.log('\nFull JSON:', JSON.stringify(result, null, 2));
        } else {
            console.log('No result returned.');
        }

    } catch (error) {
        console.error('Test Failed:', error);
    }
}

runTest();
