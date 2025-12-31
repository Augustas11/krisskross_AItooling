const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

const API_URL = 'http://localhost:3000/api/crm/leads';

async function addDummyLead() {
    try {
        console.log('📥 Fetching existing leads...');
        const response = await axios.get(API_URL);
        const existingLeads = response.data.leads || [];

        console.log(`✅ Found ${existingLeads.length} existing leads.`);

        const newLead = {
            id: 'dummy_chris_cross_' + Date.now(),
            name: 'Chris Cross',
            email: 'hello@krisskross.ai',
            storeUrl: 'https://krisskross.ai',
            status: 'New',
            addedAt: new Date().toISOString(),
            website: 'https://krisskross.ai',
            instagram: '',
            productCategory: 'AI',
            enriched: true
        };

        // Check duplicates
        if (existingLeads.some(l => l.email === newLead.email)) {
            console.log('⚠️ Lead already exists. Skipping add.');
            return;
        }

        const updatedLeads = [newLead, ...existingLeads];

        console.log(`💾 Saving ${updatedLeads.length} leads back to CRM...`);
        await axios.post(API_URL, { leads: updatedLeads });

        console.log('✅ Dummy lead created successfully!');
    } catch (error) {
        console.error('❌ Error adding dummy lead:', error.message);
    }
}

addDummyLead();
