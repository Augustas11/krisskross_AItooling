
import { researchLead } from '../lib/perplexity.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function runTest() {
    console.log('--- TESTING PERPLEXITY CONTACT EXTRACTION (MULTIPLE EMAILS) ---');

    const testLeads = [
        {
            name: 'Outerknown',
            website: 'outerknown.com',
            note: 'Should find customer care + maybe press/wholesale'
        }
    ];

    for (const lead of testLeads) {
        console.log(`\n-----------------------------------`);
        console.log(`Researching Lead: ${lead.name} (${lead.note})`);
        console.log(`-----------------------------------`);

        try {
            const result = await researchLead(lead);

            if (!result) {
                console.error('❌ No result returned.');
                continue;
            }

            console.log('\n--- CONTACT INFO EXTRACTED ---');
            if (result.contact_info) {
                console.log(JSON.stringify(result.contact_info, null, 2));

                // Check for emails
                if (Array.isArray(result.contact_info.emails)) {
                    console.log(`✅ Emails Array Found: ${result.contact_info.emails.length} emails`);
                    result.contact_info.emails.forEach(e => console.log(`   - ${e}`));
                } else if (result.contact_info.email) {
                    console.log(`⚠️ Only single email found: ${result.contact_info.email}`);
                } else {
                    console.log('❌ No emails found');
                }

            } else {
                console.log('❌ "contact_info" key missing.');
            }

        } catch (error) {
            console.error(`Test Failed for ${lead.name}:`, error);
        }
    }
}

runTest();
