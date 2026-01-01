import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

// Fallback file-based storage for when Supabase is not configured
const DB_PATH = path.join(process.cwd(), 'leads_db.json');

// File-based fallback functions
function readDb() {
    try {
        if (!fs.existsSync(DB_PATH)) {
            return { leads: [] };
        }
        const data = fs.readFileSync(DB_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('❌ [FILE] Error reading leads DB:', error);
        return { leads: [] };
    }
}

function writeDb(data) {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('❌ [FILE] Error writing to leads DB:', error);
        return false;
    }
}

// Transform Supabase row to frontend format
function transformFromDb(row) {
    return {
        id: row.id,
        name: row.name,
        productCategory: row.product_category,
        storeUrl: row.store_url,
        rating: row.rating,
        briefDescription: row.brief_description,
        status: row.status,
        addedAt: row.added_at,
        lastInteraction: row.last_interaction,
        // Enriched contact information
        businessAddress: row.business_address,
        email: row.email,
        phone: row.phone,
        instagram: row.instagram,
        tiktok: row.tiktok,
        website: row.website,
        enriched: row.enriched,

        // Scoring & Profiling
        score: row.score || 0,
        tier: row.tier || 'GRAY',
        tags: row.tags || [],
        instagramFollowers: row.instagram_followers,
        engagementRate: row.engagement_rate,
        scoreBreakdown: row.score_breakdown,
        lastScoredAt: row.last_scored_at
    };
}

// Transform frontend format to Supabase row
function transformToDb(lead) {
    return {
        id: lead.id,
        name: lead.name,
        product_category: lead.productCategory,
        store_url: lead.storeUrl,
        rating: lead.rating,
        brief_description: lead.briefDescription,
        status: lead.status,
        added_at: lead.addedAt,
        last_interaction: lead.lastInteraction,
        business_address: lead.businessAddress,
        email: lead.email,
        phone: lead.phone,
        instagram: lead.instagram,
        tiktok: lead.tiktok,
        website: lead.website,
        enriched: lead.enriched || false,

        // Scoring & Profiling
        score: lead.score || 0,
        tier: lead.tier || 'GRAY',
        tags: lead.tags || [],
        instagram_followers: lead.instagramFollowers,
        engagement_rate: lead.engagementRate,
        score_breakdown: lead.scoreBreakdown || {},
        last_scored_at: lead.lastScoredAt
    };
}

export async function GET() {
    console.log('📥 [API] GET /api/crm/leads');

    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
        console.log('⚠️ [API] Supabase not configured, using file-based storage');
        const data = readDb();
        return NextResponse.json(data);
    }

    try {
        console.log('🔄 [SUPABASE] Fetching leads from database...');
        const { data, error } = await supabase
            .from('leads')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ [SUPABASE] Error fetching leads:', error);
            throw error;
        }

        const leads = data.map(transformFromDb);
        console.log(`✅ [SUPABASE] Fetched ${leads.length} leads`);

        return NextResponse.json({ leads });
    } catch (error) {
        console.error('❌ [SUPABASE] Falling back to file storage:', error.message);
        // Fallback to file-based storage
        const data = readDb();
        return NextResponse.json(data);
    }
}

export async function POST(req) {
    console.log('💾 [API] POST /api/crm/leads (Create)');

    try {
        const body = await req.json();
        // Support both single lead and bulk leads
        const leadsToInsert = body.lead ? [body.lead] : (body.leads || []);

        if (leadsToInsert.length === 0) {
            return NextResponse.json({ message: 'No leads provided' }, { status: 400 });
        }

        console.log(`📦 [API] Received ${leadsToInsert.length} leads to insert`);

        // Check if Supabase is configured
        if (!isSupabaseConfigured()) {
            console.log('⚠️ [API] Supabase not configured, using file-based storage');
            const currentData = readDb();
            const newLeads = [...leadsToInsert, ...currentData.leads];
            const success = writeDb({ leads: newLeads });
            if (success) {
                return NextResponse.json({ message: 'Leads added to file storage', count: leadsToInsert.length });
            } else {
                throw new Error('Failed to write to file system');
            }
        }

        // Use Supabase
        console.log('🔄 [SUPABASE] Inserting leads...');
        const dbLeads = leadsToInsert.map(transformToDb);
        const { error: insertError } = await supabase
            .from('leads')
            .insert(dbLeads);

        if (insertError) {
            console.error('❌ [SUPABASE] Error inserting leads:', insertError);
            throw insertError;
        }

        return NextResponse.json({
            message: 'Leads inserted successfully',
            count: leadsToInsert.length
        });
    } catch (error) {
        console.error('❌ [API] Error adding leads:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req) {
    console.log('📝 [API] PUT /api/crm/leads (Update)');

    try {
        const body = await req.json();
        const leadToUpdate = body.lead;

        if (!leadToUpdate || !leadToUpdate.id) {
            return NextResponse.json({ message: 'No lead ID provided' }, { status: 400 });
        }

        // Check if Supabase is configured
        if (!isSupabaseConfigured()) {
            const currentData = readDb();
            const updatedLeads = currentData.leads.map(l => l.id === leadToUpdate.id ? { ...l, ...leadToUpdate } : l);
            writeDb({ leads: updatedLeads });
            return NextResponse.json({ message: 'Lead updated in file storage' });
        }

        // Use Supabase
        const dbLead = transformToDb(leadToUpdate);
        // Remove ID from update payload if it's the primary key, strictly speaking, but supabase handles it. 
        // Ideally we update based on ID in valid SQL.

        const { error } = await supabase
            .from('leads')
            .update(dbLead)
            .eq('id', leadToUpdate.id);

        if (error) throw error;

        return NextResponse.json({ message: 'Lead updated successfully' });

    } catch (error) {
        console.error('❌ [API] Error updating lead:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req) {
    console.log('🗑️ [API] DELETE /api/crm/leads');
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    // Support bulk delete via body if needed, but simple ID param is easiest for now
    // Or we can parse body for multiple IDs. Let's stick to ID param for single delete 
    // and body for bulk if explicitly requested, but keep it simple first.

    try {
        let idsToDelete = [];
        if (id) {
            idsToDelete = [id];
        } else {
            // check body for { ids: [...] }
            try {
                const body = await req.json();
                if (body.ids) idsToDelete = body.ids;
            } catch (e) {
                // Body parsing failed or empty, ignore
            }
        }

        if (idsToDelete.length === 0) {
            return NextResponse.json({ message: 'No ID provided' }, { status: 400 });
        }

        if (!isSupabaseConfigured()) {
            const currentData = readDb();
            const filteredLeads = currentData.leads.filter(l => !idsToDelete.includes(l.id));
            writeDb({ leads: filteredLeads });
            return NextResponse.json({ message: 'Lead(s) deleted from file storage' });
        }

        const { error } = await supabase
            .from('leads')
            .delete()
            .in('id', idsToDelete);

        if (error) throw error;

        return NextResponse.json({ message: 'Lead(s) deleted successfully' });

    } catch (error) {
        console.error('❌ [API] Error deleting lead:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
