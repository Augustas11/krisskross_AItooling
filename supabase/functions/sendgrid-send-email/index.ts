import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY")!
const SENDGRID_API_URL = "https://api.sendgrid.com/v3/mail/send"

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface EmailRequest {
    to: string | string[]
    subject: string
    html?: string
    text?: string
    template_id?: string
    template_data?: Record<string, unknown>
    from?: {
        email: string
        name: string
    }
    reply_to?: string
    attachments?: Array<{
        content: string // base64
        filename: string
        type: string
    }>
    // CRM tracking references
    campaign_id?: string
    lead_id?: string
    sequence_step?: number
}

interface SendGridPersonalization {
    to: Array<{ email: string; name?: string }>
    dynamic_template_data?: Record<string, unknown>
}

interface SendGridPayload {
    personalizations: SendGridPersonalization[]
    from: { email: string; name: string }
    subject?: string
    content?: Array<{ type: string; value: string }>
    template_id?: string
    reply_to?: { email: string }
    attachments?: Array<{ content: string; filename: string; type: string }>
    tracking_settings: {
        click_tracking: { enable: boolean }
        open_tracking: { enable: boolean }
    }
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders })
    }

    try {
        // 1. Validate environment
        if (!SENDGRID_API_KEY) {
            throw new Error("SENDGRID_API_KEY not configured")
        }

        // 2. Authenticate request
        const authHeader = req.headers.get("Authorization")
        if (!authHeader) {
            throw new Error("No authorization header")
        }

        const supabase = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        )

        // 3. Parse request body
        const emailRequest: EmailRequest = await req.json()

        if (!emailRequest.to || !emailRequest.subject) {
            throw new Error("Missing required fields: to, subject")
        }

        // 4. Build SendGrid payload
        const sendgridPayload = buildSendGridPayload(emailRequest)

        console.log(`📧 Sending email to ${Array.isArray(emailRequest.to) ? emailRequest.to.join(", ") : emailRequest.to}`)

        // 5. Send to SendGrid
        const sendResponse = await fetch(SENDGRID_API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${SENDGRID_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(sendgridPayload),
        })

        if (!sendResponse.ok) {
            const errorBody = await sendResponse.text()
            console.error("SendGrid error:", errorBody)
            throw new Error(`SendGrid error: ${sendResponse.status} - ${errorBody}`)
        }

        // 6. Get message ID from response headers
        const messageId = sendResponse.headers.get("X-Message-Id")
        console.log(`✅ Email sent, message ID: ${messageId}`)

        // 7. Record in database
        const toEmail = Array.isArray(emailRequest.to) ? emailRequest.to[0] : emailRequest.to

        const { data: emailSend, error: dbError } = await supabase
            .from("email_sends")
            .insert({
                campaign_id: emailRequest.campaign_id || null,
                lead_id: emailRequest.lead_id || null,
                sendgrid_message_id: messageId,
                subject_line: emailRequest.subject,
                sent_to_email: toEmail,
                sent_from_email: emailRequest.from?.email || "noreply@krisskross.ai",
                status: "sent",
                sequence_step: emailRequest.sequence_step || null,
            })
            .select()
            .single()

        if (dbError) {
            console.error("Database error (non-fatal):", dbError)
            // Don't fail the request - email was already sent
        }

        // 8. Update lead's last_email_sent_at if lead_id provided
        if (emailRequest.lead_id) {
            await supabase
                .from("leads")
                .update({ last_email_sent_at: new Date().toISOString() })
                .eq("id", emailRequest.lead_id)
        }

        return new Response(
            JSON.stringify({
                success: true,
                message_id: messageId,
                email_send_id: emailSend?.id || null,
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            }
        )

    } catch (error) {
        console.error("Error:", error)
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 500,
            }
        )
    }
})

function buildSendGridPayload(req: EmailRequest): SendGridPayload {
    const toArray = Array.isArray(req.to) ? req.to : [req.to]

    const payload: SendGridPayload = {
        personalizations: [
            {
                to: toArray.map((email) => ({ email })),
            },
        ],
        from: {
            email: req.from?.email || "noreply@krisskross.ai",
            name: req.from?.name || "KrissKross",
        },
        tracking_settings: {
            click_tracking: { enable: true },
            open_tracking: { enable: true },
        },
    }

    // Template or direct content?
    if (req.template_id) {
        payload.template_id = req.template_id
        if (req.template_data) {
            payload.personalizations[0].dynamic_template_data = req.template_data
        }
    } else {
        payload.subject = req.subject
        payload.content = []
        if (req.text) {
            payload.content.push({ type: "text/plain", value: req.text })
        }
        if (req.html) {
            payload.content.push({ type: "text/html", value: req.html })
        }
        // Fallback: if neither provided, use subject as text
        if (payload.content.length === 0) {
            payload.content.push({ type: "text/plain", value: req.subject })
        }
    }

    // Reply-to
    if (req.reply_to) {
        payload.reply_to = { email: req.reply_to }
    }

    // Attachments
    if (req.attachments?.length) {
        payload.attachments = req.attachments
    }

    return payload
}
