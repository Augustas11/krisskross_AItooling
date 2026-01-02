import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { autoTagLead } from '@/lib/tags';
import { enrollLeadInSequence, getSequenceIdByType } from '@/lib/email-sequences';
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
        // tier: row.tier || 'GRAY', // Removed
        tags: (row.tags || []).map(tag => {
            // Handle tags stored as JSON strings in database
            if (typeof tag === 'string') {
                try {
                    return JSON.parse(tag);
                } catch (e) {
                    console.warn('Failed to parse tag:', tag);
                    return tag;
                }
            }
            return tag;
        }),
        instagramFollowers: row.instagram_followers,
        engagementRate: row.engagement_rate,
        postingFrequency: row.posting_frequency,
        scoreBreakdown: row.score_breakdown,
        lastScoredAt: row.last_scored_at,
        lastTaggedAt: row.last_tagged_at,

        // New V2 Enrichment Fields
        aiResearchSummary: row.ai_research_summary,
        instagramBusinessCategory: row.instagram_business_category,
        hasReels: row.has_reels,
        avgVideoViews: row.avg_video_views,
        enrichmentHistory: row.enrichment_history,

        // Task Management (Phase 1)
        nextAction: row.next_action,
        nextActionDue: row.next_action_due,
        assignedTo: row.assigned_to
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
        // tier: lead.tier || 'GRAY', // Removed
        tags: lead.tags || [],
        instagram_followers: lead.instagramFollowers,
        engagement_rate: lead.engagementRate,
        posting_frequency: lead.postingFrequency,
        score_breakdown: lead.scoreBreakdown || {},
        last_scored_at: lead.lastScoredAt,
        last_tagged_at: lead.lastTaggedAt,

        // New V2 Enrichment Fields
        ai_research_summary: lead.ai_research_summary,
        instagram_business_category: lead.instagramBusinessCategory,
        has_reels: lead.hasReels,
        avg_video_views: lead.avgVideoViews,
        enrichment_history: lead.enrichmentHistory,

        // Task Management (Phase 1)
        next_action: lead.nextAction,
        next_action_due: lead.nextActionDue,
        assigned_to: lead.assignedTo
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

        // Auto-tag all leads before inserting
        console.log('🏷️ [API] Auto-tagging leads...');
        const taggedLeads = [];
        for (const lead of leadsToInsert) {
            try {
                const tagged = await autoTagLead(lead);
                taggedLeads.push(tagged);
            } catch (error) {
                console.error(`❌ [API] Error auto-tagging lead ${lead.id}:`, error);
                taggedLeads.push(lead); // Include untagged lead
            }
        }

        // Check if Supabase is configured
        if (!isSupabaseConfigured()) {
            console.log('⚠️ [API] Supabase not configured, using file-based storage');
            const currentData = readDb();
            const newLeads = [...taggedLeads, ...currentData.leads];
            const success = writeDb({ leads: newLeads });
            if (success) {
                return NextResponse.json({ message: 'Leads added to file storage', count: taggedLeads.length });
            } else {
                throw new Error('Failed to write to file system');
            }
        }

        // Use Supabase - Check for duplicates first
        console.log('🔍 [SUPABASE] Checking for duplicates...');
        const leadsToInsertFinal = [];
        const duplicates = [];

        for (const lead of taggedLeads) {
            // Skip if no email or instagram (can't check for duplicates)
            if (!lead.email && !lead.instagram) {
                leadsToInsertFinal.push(lead);
                continue;
            }

            // Build OR condition for duplicate check
            let orCondition = '';
            if (lead.email) orCondition += `email.eq.${lead.email}`;
            if (lead.instagram) {
                if (orCondition) orCondition += ',';
                orCondition += `instagram.eq.${lead.instagram}`;
            }

            // Check if lead already exists
            const { data: existing, error: checkError } = await supabase
                .from('leads')
                .select('id, name, email, instagram')
                .or(orCondition)
                .limit(1);

            if (checkError) {
                console.error('❌ [SUPABASE] Error checking duplicates:', checkError);
                leadsToInsertFinal.push(lead);
                continue;
            }

            if (existing && existing.length > 0) {
                // Duplicate found - update last_interaction
                console.log(`⚠️ [SUPABASE] Duplicate: ${lead.name} (${lead.email || lead.instagram}), updating timestamp`);

                await supabase
                    .from('leads')
                    .update({
                        last_interaction: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existing[0].id);

                duplicates.push({
                    name: lead.name,
                    existingId: existing[0].id,
                    matchedOn: lead.email ? 'email' : 'instagram'
                });
            } else {
                // No duplicate
                leadsToInsertFinal.push(lead);
            }
        }

        console.log(`✅ [SUPABASE] ${leadsToInsertFinal.length} new, ${duplicates.length} duplicates`);

        // Insert only non-duplicates
        if (leadsToInsertFinal.length > 0) {
            const dbLeads = leadsToInsertFinal.map(transformToDb);
            const { data: insertedLeads, error: insertError } = await supabase
                .from('leads')
                .insert(dbLeads)
                .select(); // Select to get IDs

            if (insertError) {
                console.error('❌ [SUPABASE] Error inserting leads:', insertError);
                throw insertError;
            }

            // AUTO-ENROLL LOGIC (Phase 2 & 3)
            // Check for trial signups and enroll in onboarding sequence

            // We need to resolve this asynchronously but don't block response? 
            // Better to block to ensure it happens or fire and forget. 
            // Let's do it in background (no await) to speed up UI, or await to be safe?
            // Safest: await Promise.all
            try {
                // Pre-fetch sequence IDs
                const [trialSeqId, fashionSeqId, affiliateSeqId] = await Promise.all([
                    getSequenceIdByType('trial_onboarding'),
                    getSequenceIdByType('fashion_owner'),
                    getSequenceIdByType('affiliate')
                ]);

                if (insertedLeads.length > 0) {
                    console.log(`🚀 [API] Auto-enrolling ${insertedLeads.length} leads (checking segments)...`);

                    const enrollPromises = insertedLeads.map(async (lead) => {
                        // 1. Priority: Trial Signups
                        const isTrial = lead.store_url?.includes('trial') || lead.tags?.includes('trial') || (body.source === 'trial') || body.autoEnroll;
                        if (isTrial && trialSeqId) {
                            console.log(`✨ Enrolling ${lead.id} in Trial Sequence`);
                            return enrollLeadInSequence(lead.id, trialSeqId);
                        }

                        // 2. Cold Outreach Segments (Only if not a trial)
                        const category = (lead.product_category || '').toLowerCase();
                        const tags = (lead.tags || []).map(t => typeof t === 'string' ? t.toLowerCase() : t?.name?.toLowerCase() || '');
                        const combinedInfo = `${category} ${tags.join(' ')}`;

                        if (fashionSeqId && (combinedInfo.includes('fashion') || combinedInfo.includes('clothing') || combinedInfo.includes('apparel') || combinedInfo.includes('boutique'))) {
                            console.log(`👗 Enrolling ${lead.id} in Fashion Sequence`);
                            return enrollLeadInSequence(lead.id, fashionSeqId);
                        }

                        if (affiliateSeqId && (combinedInfo.includes('affiliate') || combinedInfo.includes('commission') || combinedInfo.includes('ugc') || combinedInfo.includes('creator') || combinedInfo.includes('dropship'))) {
                            console.log(`🤝 Enrolling ${lead.id} in Affiliate Sequence`);
                            return enrollLeadInSequence(lead.id, affiliateSeqId);
                        }

                        // Default: No auto-enrollment for generic cold leads (keep manual control)
                        return null;
                    });

                    await Promise.all(enrollPromises);
                }
            } catch (seqError) {
                console.error('⚠️ [API] Failed to auto-enroll leads:', seqError);
            }
        }

        return NextResponse.json({
            message: 'Leads processed successfully',
            inserted: leadsToInsertFinal.length,
            duplicates: duplicates.length,
            duplicateDetails: duplicates
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
