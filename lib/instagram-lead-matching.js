/**
 * Instagram Lead Matching Service
 * 
 * Matches Instagram usernames from DMs and comments to CRM leads
 * Handles automatic matching, fuzzy matching, and pending match queue
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Match Instagram username to a lead in the CRM
 * @param {string} instagramUsername - Username to match (with or without @)
 * @param {object} options - Additional matching options
 * @returns {object} - Matched lead or null
 */
export async function matchInstagramToLead(instagramUsername, options = {}) {
    const cleanUsername = instagramUsername.replace('@', '').toLowerCase();

    // Step 1: Try exact match on instagram_handle
    const { data: exactMatch, error: exactError } = await supabase
        .from('leads')
        .select('*')
        .ilike('instagram_handle', cleanUsername)
        .single();

    if (exactMatch && !exactError) {
        console.log('✓ Exact Instagram handle match found:', exactMatch.id);
        return { success: true, lead: exactMatch, matchType: 'exact' };
    }

    // Step 2: Try partial match (handle contains username)
    const { data: partialMatches, error: partialError } = await supabase
        .from('leads')
        .select('*')
        .ilike('instagram_handle', `%${cleanUsername}%`)
        .limit(5);

    if (partialMatches && partialMatches.length === 1) {
        console.log('✓ Partial Instagram handle match found:', partialMatches[0].id);
        return { success: true, lead: partialMatches[0], matchType: 'partial' };
    }

    if (partialMatches && partialMatches.length > 1) {
        console.log('⚠️ Multiple partial matches found, creating pending match');
        // Multiple matches - too ambiguous, add to pending
        await createPendingMatch(instagramUsername, options);
        return { success: false, reason: 'multiple_matches', candidates: partialMatches };
    }

    // Step 3: Fuzzy match on name/email (optional, more expensive)
    // Could implement Levenshtein distance or similar here
    // For now, skip to avoid performance issues

    // Step 4: No match found - create pending match for manual review
    console.log('⚠️ No match found for @' + cleanUsername + ', creating pending match');
    await createPendingMatch(instagramUsername, options);

    return {
        success: false,
        reason: 'no_match',
        message: 'No matching lead found - added to pending matches'
    };
}

/**
 * Create a pending match for manual review
 */
async function createPendingMatch(instagramUsername, options = {}) {
    const cleanUsername = instagramUsername.replace('@', '');

    // Check if pending match already exists
    const { data: existing } = await supabase
        .from('instagram_pending_matches')
        .select('id')
        .eq('instagram_username', cleanUsername)
        .eq('match_status', 'pending')
        .single();

    if (existing) {
        console.log('Pending match already exists:', existing.id);
        return existing;
    }

    // Create new pending match
    const { data, error } = await supabase
        .from('instagram_pending_matches')
        .insert({
            instagram_user_id: options.instagramUserId || null,
            instagram_username: cleanUsername,
            interaction_type: options.interactionType || 'dm',
            message_preview: options.messagePreview || null
        })
        .select()
        .single();

    if (error) {
        console.error('Failed to create pending match:', error);
        return null;
    }

    console.log('✓ Created pending match:', data.id);
    return data;
}

/**
 * Get all pending matches for manual review
 * @param {string} status - Filter by match_status (pending/matched/ignored)
 */
export async function getPendingMatches(status = 'pending') {
    const { data, error } = await supabase
        .from('instagram_pending_matches')
        .select('*')
        .eq('match_status', status)
        .order('first_seen_at', { ascending: false });

    if (error) {
        console.error('Failed to fetch pending matches:', error);
        return { success: false, error };
    }

    return { success: true, data };
}

/**
 * Confirm a manual match between pending Instagram user and lead
 * @param {string} pendingId - UUID of pending match record
 * @param {string} leadId - UUID of lead to match to
 * @param {string} userId - UUID of admin user making the match
 */
export async function confirmMatch(pendingId, leadId, userId) {
    // Get pending match details
    const { data: pending, error: pendingError } = await supabase
        .from('instagram_pending_matches')
        .select('instagram_username')
        .eq('id', pendingId)
        .single();

    if (pendingError || !pending) {
        return { success: false, error: 'Pending match not found' };
    }

    // Update lead with Instagram handle
    const { error: leadError } = await supabase
        .from('leads')
        .update({ instagram_handle: pending.instagram_username })
        .eq('id', leadId);

    if (leadError) {
        return { success: false, error: 'Failed to update lead' };
    }

    // Mark pending match as matched
    const { error: matchError } = await supabase
        .from('instagram_pending_matches')
        .update({
            match_status: 'matched',
            matched_lead_id: leadId,
            matched_at: new Date().toISOString(),
            matched_by: userId
        })
        .eq('id', pendingId);

    if (matchError) {
        return { success: false, error: 'Failed to update pending match' };
    }

    console.log(`✓ Confirmed match: @${pending.instagram_username} → Lead ${leadId}`);
    return { success: true };
}

/**
 * Ignore a pending match (mark as not relevant)
 * @param {string} pendingId - UUID of pending match record
 */
export async function ignorePendingMatch(pendingId) {
    const { error } = await supabase
        .from('instagram_pending_matches')
        .update({ match_status: 'ignored' })
        .eq('id', pendingId);

    if (error) {
        return { success: false, error: 'Failed to update pending match' };
    }

    return { success: true };
}

/**
 * Suggest possible lead matches based on fuzzy matching
 * @param {string} instagramUsername - Username to find matches for
 */
export async function suggestMatches(instagramUsername) {
    const cleanUsername = instagramUsername.replace('@', '').toLowerCase();

    // Try to extract name parts from username
    // e.g., "john_doe_shop" → "john", "doe"
    const nameParts = cleanUsername
        .split(/[_\-\.]/)
        .filter(part => part.length > 2);

    if (nameParts.length === 0) {
        return { success: true, suggestions: [] };
    }

    // Search leads by name similarity
    const { data, error } = await supabase
        .from('leads')
        .select('id, first_name, last_name, business_name, email, instagram_handle')
        .or(nameParts.map(part => `first_name.ilike.%${part}%,last_name.ilike.%${part}%,business_name.ilike.%${part}%`).join(','))
        .limit(10);

    if (error) {
        console.error('Failed to suggest matches:', error);
        return { success: false, error };
    }

    return { success: true, suggestions: data || [] };
}

export default {
    matchInstagramToLead,
    getPendingMatches,
    confirmMatch,
    ignorePendingMatch,
    suggestMatches
};
