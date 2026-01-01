
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { analyzeLeadForTags } from '../lib/tags/ai-analyzer.js';

// Setup environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function runSimulation() {
    console.log('--- STARTING ENRICHMENT SIMULATION ---');
    console.log('Target Lead: Arach&Cloz');

    const leadContext = {
        name: 'Arach&Cloz',
        website: 'arach-cloz.com',
        productCategory: 'Fashion', // Inferred from "cloz"
        briefDescription: 'Imported via CSV',
        biography: 'Fashion brand for the modern woman. Worldwide shipping.', // MOCKED BIO based on "Fashion"
        instagram: 'arachcloz'
    };

    // MOCK Instagram Posts (simulating what Apify would return roughly)
    // If we assume the site is fashion, posts likely contain these keywords
    const mockPosts = [
        { caption: "New summer collection drops tomorrow! ☀️ #summerfashion #ootd", ownerUsername: "arachcloz" },
        { caption: "Behind the scenes of our latest photoshoot. It takes a village! 📸", ownerUsername: "arachcloz" },
        { caption: "Shop the look at the link in bio. Limited stock available.", ownerUsername: "arachcloz" },
        { caption: "We love seeing you in our clothes! Tag us to be featured.", ownerUsername: "arachcloz" }
    ];

    console.log('\nINPUT CONTEXT:');
    console.log(JSON.stringify(leadContext, null, 2));
    console.log(`\nINPUT POSTS (${mockPosts.length}):`);
    mockPosts.forEach(p => console.log(`- "${p.caption}"`));

    console.log('\n--- CALLING CLAUDE API ---');

    try {
        const tags = await analyzeLeadForTags(mockPosts, leadContext);

        console.log('\n--- CLAUDE RESPONSE (PARSED TAGS) ---');
        console.log(JSON.stringify(tags, null, 2));

        console.log('\n-------------------------------------');
        console.log(`Total Tags Generated: ${tags.length}`);
        console.log('Simulation Complete.');

    } catch (error) {
        console.error('Simulation Failed:', error);
    }
}

runSimulation();
