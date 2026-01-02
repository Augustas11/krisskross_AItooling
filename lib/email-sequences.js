import { supabase, isSupabaseConfigured } from './supabase';

/**
 * Replace merge tags in email template with lead data
 */
export function replaceMergeTags(template, lead) {
    return template
        .replace(/\{\{name\}\}/g, lead.name || 'there')
        .replace(/\{\{business_category\}\}/g, lead.productCategory || lead.product_category || 'your business')
        .replace(/\{\{instagram\}\}/g, lead.instagram || '')
        .replace(/\{\{email\}\}/g, lead.email || '')
        .replace(/\{\{store_url\}\}/g, lead.storeUrl || lead.store_url || '');
}

/**
 * Check if lead has replied to any emails
 */
export async function hasLeadReplied(leadId) {
    if (!isSupabaseConfigured()) return false;

    try {
        // Check if lead status is "Replied"
        const { data: lead, error } = await supabase
            .from('leads')
            .select('status')
            .eq('id', leadId)
            .single();

        if (error) throw error;

        return lead?.status?.toLowerCase() === 'replied';
    } catch (error) {
        console.error('Error checking lead reply status:', error);
        return false;
    }
}

/**
 * Check if lead should receive next email in sequence
 */
export async function shouldSendNextEmail(leadId) {
    if (!isSupabaseConfigured()) return false;

    try {
        // 1. Check if lead has replied
        const replied = await hasLeadReplied(leadId);
        if (replied) {
            console.log(`Lead ${leadId} has replied, skipping email`);
            return false;
        }

        // 2. Check if lead is in active sequence
        const { data: lead, error: leadError } = await supabase
            .from('leads')
            .select('in_sequence, sequence_paused, status')
            .eq('id', leadId)
            .single();

        if (leadError) throw leadError;

        if (!lead.in_sequence) {
            console.log(`Lead ${leadId} not in sequence`);
            return false;
        }

        if (lead.sequence_paused) {
            console.log(`Lead ${leadId} sequence is paused`);
            return false;
        }

        // 3. Check if lead unsubscribed or marked as dead
        if (lead.status?.toLowerCase() === 'dead' || lead.status?.toLowerCase() === 'unsubscribed') {
            console.log(`Lead ${leadId} is ${lead.status}, skipping email`);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error checking if should send email:', error);
        return false;
    }
}

/**
 * Enroll a lead in an email sequence
 */
export async function enrollLeadInSequence(leadId, sequenceId) {
    if (!isSupabaseConfigured()) {
        console.warn('Supabase not configured, cannot enroll in sequence');
        return { success: false, error: 'Supabase not configured' };
    }

    try {
        // Check if already enrolled in an active sequence
        const { data: existingEnrollment, error: checkError } = await supabase
            .from('email_sequence_enrollments')
            .select('id')
            .eq('lead_id', leadId)
            .is('completed_at', null)
            .is('unenrolled_at', null)
            .single();

        if (existingEnrollment) {
            console.log(`Lead ${leadId} already enrolled in a sequence`);
            return { success: false, error: 'Already enrolled in a sequence' };
        }

        // Create enrollment
        const { data: enrollment, error: enrollError } = await supabase
            .from('email_sequence_enrollments')
            .insert([{
                lead_id: leadId,
                sequence_id: sequenceId,
                current_step: 1,
                enrolled_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (enrollError) throw enrollError;

        // Update lead
        const { error: updateError } = await supabase
            .from('leads')
            .update({ in_sequence: true })
            .eq('id', leadId);

        if (updateError) throw updateError;

        console.log(`✅ Lead ${leadId} enrolled in sequence ${sequenceId}`);
        return { success: true, enrollment };
    } catch (error) {
        console.error('Error enrolling lead in sequence:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Unenroll a lead from their current sequence
 */
export async function unenrollLeadFromSequence(leadId, reason = 'manual') {
    if (!isSupabaseConfigured()) {
        console.warn('Supabase not configured, cannot unenroll from sequence');
        return { success: false, error: 'Supabase not configured' };
    }

    try {
        // Find active enrollment
        const { data: enrollment, error: findError } = await supabase
            .from('email_sequence_enrollments')
            .select('id')
            .eq('lead_id', leadId)
            .is('completed_at', null)
            .is('unenrolled_at', null)
            .single();

        if (findError && findError.code !== 'PGRST116') throw findError;

        if (!enrollment) {
            console.log(`No active enrollment found for lead ${leadId}`);
            return { success: false, error: 'No active enrollment' };
        }

        // Update enrollment
        const { error: updateEnrollmentError } = await supabase
            .from('email_sequence_enrollments')
            .update({
                unenrolled_at: new Date().toISOString(),
                unenroll_reason: reason
            })
            .eq('id', enrollment.id);

        if (updateEnrollmentError) throw updateEnrollmentError;

        // Update lead
        const { error: updateLeadError } = await supabase
            .from('leads')
            .update({ in_sequence: false })
            .eq('id', leadId);

        if (updateLeadError) throw updateLeadError;

        console.log(`✅ Lead ${leadId} unenrolled from sequence (reason: ${reason})`);
        return { success: true };
    } catch (error) {
        console.error('Error unenrolling lead from sequence:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get the default cold outreach sequence ID
 */
export async function getDefaultColdOutreachSequenceId() {
    if (!isSupabaseConfigured()) return null;

    try {
        const { data, error } = await supabase
            .from('email_sequences')
            .select('id')
            .eq('sequence_type', 'cold_outreach')
            .eq('active', true)
            .single();

        if (error) throw error;
        return data?.id || null;
    } catch (error) {
        console.error('Error getting default sequence:', error);
        return null;
    }
}

/**
 * Pause a lead's sequence
 */
export async function pauseLeadSequence(leadId) {
    if (!isSupabaseConfigured()) return { success: false };

    try {
        const { error } = await supabase
            .from('leads')
            .update({ sequence_paused: true })
            .eq('id', leadId);

        if (error) throw error;

        console.log(`⏸️ Paused sequence for lead ${leadId}`);
        return { success: true };
    } catch (error) {
        console.error('Error pausing sequence:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Resume a lead's sequence
 */
export async function resumeLeadSequence(leadId) {
    if (!isSupabaseConfigured()) return { success: false };

    try {
        const { error } = await supabase
            .from('leads')
            .update({ sequence_paused: false })
            .eq('id', leadId);

        if (error) throw error;

        console.log(`▶️ Resumed sequence for lead ${leadId}`);
        return { success: true };
    } catch (error) {
        console.error('Error resuming sequence:', error);
        return { success: false, error: error.message };
    }
}
