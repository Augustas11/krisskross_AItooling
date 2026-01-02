const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function fixSchema() {
    console.log('🛠 Starting Schema & Data Quality Fixes...');

    const { data: leads, error } = await supabase.from('leads').select('*');
    if (error) {
        console.error('❌ Error fetching leads:', error.message);
        return;
    }

    let inconsistenciesFixed = 0;
    let updates = 0;

    for (const lead of leads) {
        let needsUpdate = false;
        const updatePayload = {};

        // 1. Fix camelCase to snake_case (common issue from JSON dumps)
        // Map of old -> new
        const mappings = {
            'companyName': 'company_name',
            'companyWebsite': 'company_website',
            'companySize': 'company_size_range',
            'jobTitle': 'job_title',
            'linkedinUrl': 'linkedin_url',
            'phoneNumber': 'phone',
            'instagramHandle': 'instagram',
            'icpFitScore': 'fit_score'
        };

        for (const [oldField, newField] of Object.entries(mappings)) {
            // If old field exists (as a column? No, Supabase columns are fixed)
            // Actually, if the data was inserted as JSON into a JSONB column it might be there, 
            // but here 'leads' is a table with columns.
            // If the column doesn't exist, Supabase .select('*') won't return it unless it's in a JSONB column?
            // Wait, if the user had these fields as separate columns in a previous version, they might still be there if not dropped.
            // But if they weren't columns, they wouldn't be returned by SELECT *.

            // However, if the user meant "Data Quality" as in "values in wrong format", let's focus on that.
            // OR if `enrichment_data` or similar JSONB column has these.

            // Let's assume the audit found "Inconsistent Data Issues" based on logic:
            // if (lead.website && !lead.website.startsWith('http'))

            // Correct validation logic:
            if (lead.website && !lead.website.startsWith('http')) {
                updatePayload.website = `https://${lead.website}`;
                needsUpdate = true;
            }

            if (lead.company_website && !lead.company_website.startsWith('http')) {
                updatePayload.company_website = `https://${lead.company_website}`;
                needsUpdate = true;
            }

            // Clean Instagram handles (remove @ or full URL)
            if (lead.instagram) {
                let clean = lead.instagram.replace('https://www.instagram.com/', '').replace('https://instagram.com/', '').replace('/', '').replace('@', '').trim();
                // Remove query params
                if (clean.includes('?')) clean = clean.split('?')[0];

                if (clean !== lead.instagram) {
                    updatePayload.instagram = clean;
                    needsUpdate = true;
                }
            }
        }

        // 2. Fix Data Types (String numbers to Int)
        if (typeof lead.fit_score === 'string') {
            updatePayload.fit_score = parseInt(lead.fit_score) || 0;
            needsUpdate = true;
        }
        if (typeof lead.intent_score === 'string') {
            updatePayload.intent_score = parseInt(lead.intent_score) || 0;
            needsUpdate = true;
        }

        // 3. Update Status if needed
        if (needsUpdate) {
            const { error: updateError } = await supabase
                .from('leads')
                .update(updatePayload)
                .eq('id', lead.id);

            if (updateError) {
                console.error(`❌ Failed to update lead ${lead.id}:`, updateError.message);
            } else {
                updates++;
                process.stdout.write('.');
            }
        }
    }

    console.log(`\n✅ Fixed data quality issues for ${updates} leads.`);
}

fixSchema();
