import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

/**
 * SendGrid Event Webhook Handler
 * 
 * This edge function receives webhook events from SendGrid when email events occur:
 * - delivered, open, click, bounce, spamreport, unsubscribe, etc.
 * 
 * Configure in SendGrid: Settings → Mail Settings → Event Webhook
 * URL: https://[PROJECT_REF].supabase.co/functions/v1/sendgrid-webhook-handler
 */

interface SendGridEvent {
    email: string
    timestamp: number
    event: string
    sg_message_id: string
    // Click events
    url?: string
    // Bounce events
    reason?: string
    type?: string
    bounce_classification?: string
    // User agent / IP
    useragent?: string
    ip?: string
    // Full event data
    [key: string]: unknown
}

serve(async (req) => {
    // SendGrid sends POST requests with JSON array of events
    if (req.method !== "POST") {
        return new Response("Method not allowed", { status: 405 })
    }

    try {
        // Initialize Supabase client with service role (full access for webhooks)
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        )

        // Parse webhook events (SendGrid sends array of events)
        const events: SendGridEvent[] = await req.json()

        console.log(`📬 Received ${events.length} webhook events`)

        // Process each event
        for (const event of events) {
            await processEvent(event, supabase)
        }

        // Always return 200 to SendGrid or it will retry
        return new Response(JSON.stringify({ success: true, processed: events.length }), {
            headers: { "Content-Type": "application/json" },
            status: 200,
        })

    } catch (error) {
        console.error("Webhook error:", error)
        // Still return 200 to prevent SendGrid retries on parse errors
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { "Content-Type": "application/json" },
            status: 200,
        })
    }
})

async function processEvent(event: SendGridEvent, supabase: ReturnType<typeof createClient>) {
    const messageId = event.sg_message_id?.split(".")[0] // Clean message ID
    const eventType = event.event
    const timestamp = new Date(event.timestamp * 1000).toISOString()

    console.log(`  → Processing ${eventType} for ${messageId}`)

    if (!messageId) {
        console.warn("  ⚠️ No message ID in event, skipping")
        return
    }

    // 1. Find the email_sends record by SendGrid message ID
    const { data: emailSend, error: lookupError } = await supabase
        .from("email_sends")
        .select("id, lead_id, open_count, click_count")
        .eq("sendgrid_message_id", messageId)
        .single()

    if (lookupError || !emailSend) {
        console.warn(`  ⚠️ No email_send found for message ${messageId}`)
        // Still log the event for debugging
        await supabase.from("email_events").insert({
            sendgrid_message_id: messageId,
            event_type: eventType,
            event_data: event,
            url_clicked: event.url,
            user_agent: event.useragent,
            ip_address: event.ip,
        })
        return
    }

    // 2. Log the event
    await supabase.from("email_events").insert({
        email_send_id: emailSend.id,
        sendgrid_message_id: messageId,
        event_type: eventType,
        event_data: event,
        url_clicked: event.url,
        user_agent: event.useragent,
        ip_address: event.ip,
        processed: true,
    })

    // 3. Update email_sends based on event type
    const emailUpdates: Record<string, unknown> = {}

    switch (eventType) {
        case "delivered":
            emailUpdates.status = "delivered"
            emailUpdates.delivered_at = timestamp
            break

        case "open":
            // Only set opened_at on first open
            emailUpdates.open_count = (emailSend.open_count || 0) + 1
            if (!emailSend.opened_at) {
                emailUpdates.opened_at = timestamp
            }
            break

        case "click":
            emailUpdates.click_count = (emailSend.click_count || 0) + 1
            if (!emailSend.first_clicked_at) {
                emailUpdates.first_clicked_at = timestamp
            }
            break

        case "bounce":
        case "blocked":
        case "dropped":
            emailUpdates.status = "failed"
            emailUpdates.bounced_at = timestamp
            emailUpdates.bounce_reason = event.reason || event.bounce_classification || eventType
            break

        case "spamreport":
            emailUpdates.spam_reported_at = timestamp
            break

        case "unsubscribe":
        case "group_unsubscribe":
            emailUpdates.unsubscribed_at = timestamp
            break
    }

    // Apply updates to email_sends
    if (Object.keys(emailUpdates).length > 0) {
        await supabase
            .from("email_sends")
            .update(emailUpdates)
            .eq("id", emailSend.id)
    }

    // 4. Update lead record if we have a lead_id
    if (emailSend.lead_id) {
        await updateLeadFromEvent(eventType, emailSend.lead_id, timestamp, supabase)
    }

    // 5. Update campaign stats if applicable
    // (This could be done in batch for better performance)
    await updateCampaignStats(emailSend.id, eventType, supabase)
}

async function updateLeadFromEvent(
    eventType: string,
    leadId: string,
    timestamp: string,
    supabase: ReturnType<typeof createClient>
) {
    const leadUpdates: Record<string, unknown> = {}

    switch (eventType) {
        case "open":
            leadUpdates.last_email_opened_at = timestamp
            // Increase engagement score by 5 (max 100)
            await supabase.rpc("increment_lead_engagement", {
                lead_id: leadId,
                increment_by: 5
            }).catch(() => {
                // Fallback if RPC doesn't exist yet
                supabase
                    .from("leads")
                    .update({ email_engagement_score: 5 })
                    .eq("id", leadId)
                    .eq("email_engagement_score", 0)
            })
            break

        case "click":
            // Higher engagement for clicks (+10)
            await supabase.rpc("increment_lead_engagement", {
                lead_id: leadId,
                increment_by: 10
            }).catch(() => { })
            break

        case "bounce":
        case "blocked":
            leadUpdates.email_bounced = true
            break

        case "unsubscribe":
        case "group_unsubscribe":
            leadUpdates.email_unsubscribed = true
            break
    }

    if (Object.keys(leadUpdates).length > 0) {
        await supabase
            .from("leads")
            .update(leadUpdates)
            .eq("id", leadId)
    }
}

async function updateCampaignStats(
    emailSendId: string,
    eventType: string,
    supabase: ReturnType<typeof createClient>
) {
    // Get campaign_id from email_sends
    const { data: send } = await supabase
        .from("email_sends")
        .select("campaign_id")
        .eq("id", emailSendId)
        .single()

    if (!send?.campaign_id) return

    // Map event types to campaign stat columns
    const statMap: Record<string, string> = {
        delivered: "delivered_count",
        open: "opened_count",
        click: "clicked_count",
        bounce: "bounced_count",
        blocked: "bounced_count",
        unsubscribe: "unsubscribed_count",
        group_unsubscribe: "unsubscribed_count",
    }

    const columnName = statMap[eventType]
    if (!columnName) return

    // Increment the appropriate counter
    // Note: This is simplified - for high volume you'd want to batch these
    const { data: campaign } = await supabase
        .from("email_campaigns")
        .select(columnName)
        .eq("id", send.campaign_id)
        .single()

    if (campaign) {
        await supabase
            .from("email_campaigns")
            .update({ [columnName]: (campaign[columnName] || 0) + 1 })
            .eq("id", send.campaign_id)
    }
}
