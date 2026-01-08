// Instagram Webhook Receiver
// Supabase Edge Function to handle Instagram webhook events

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-hub-signature-256',
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const url = new URL(req.url)
        const method = req.method

        // Handle Facebook webhook verification
        if (method === 'GET') {
            const mode = url.searchParams.get('hub.mode')
            const token = url.searchParams.get('hub.verify_token')
            const challenge = url.searchParams.get('hub.challenge')

            const VERIFY_TOKEN = Deno.env.get('INSTAGRAM_WEBHOOK_VERIFY_TOKEN') || 'krisskross_instagram_webhook_2026'

            if (mode === 'subscribe' && token === VERIFY_TOKEN) {
                console.log('✓ Webhook verification successful')
                return new Response(challenge, {
                    headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
                    status: 200
                })
            }

            console.error('❌ Webhook verification failed')
            return new Response('Forbidden', { headers: corsHeaders, status: 403 })
        }

        // Handle webhook POST events
        if (method === 'POST') {
            const rawBody = await req.text()
            const signature = req.headers.get('x-hub-signature-256')
            const appSecret = Deno.env.get('INSTAGRAM_APP_SECRET')

            // Verify signature
            if (!signature || !appSecret) {
                console.error('Missing signature or app secret')
                return new Response('Unauthorized', { headers: corsHeaders, status: 401 })
            }

            const isValid = await verifySignature(signature, rawBody, appSecret)
            if (!isValid) {
                console.error('Invalid webhook signature')
                return new Response('Unauthorized', { headers: corsHeaders, status: 401 })
            }

            // Parse and process events
            const body = JSON.parse(rawBody)
            console.log('Received webhook:', JSON.stringify(body, null, 2))

            const supabase = createClient(
                Deno.env.get('SUPABASE_URL') ?? '',
                Deno.env.get('SUPABASE_ANON_KEY') ?? ''
            )

            // Process each entry
            for (const entry of body.entry || []) {
                await processEntry(entry, supabase)
            }

            return new Response(JSON.stringify({ success: true }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            })
        }

        return new Response('Method Not Allowed', { headers: corsHeaders, status: 405 })

    } catch (error) {
        console.error('Webhook error:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
        })
    }
})

/**
 * Verify HMAC SHA-256 signature
 */
async function verifySignature(signature: string, payload: string, secret: string): Promise<boolean> {
    const signatureHash = signature.replace('sha256=', '')

    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    )

    const signed = await crypto.subtle.sign(
        'HMAC',
        key,
        encoder.encode(payload)
    )

    const expectedSignature = Array.from(new Uint8Array(signed))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')

    return signatureHash === expectedSignature
}

/**
 * Process webhook entry
 */
async function processEntry(entry: any, supabase: any) {
    // Handle messaging events (DMs)
    if (entry.messaging) {
        for (const messagingEvent of entry.messaging) {
            await processMessageEvent(messagingEvent, supabase)
        }
    }

    // Handle changes (comments, mentions)
    if (entry.changes) {
        for (const change of entry.changes) {
            if (change.field === 'comments') {
                await processCommentEvent(change.value, supabase)
            } else if (change.field === 'mentions') {
                await processMentionEvent(change.value, supabase)
            }
        }
    }
}

/**
 * Process DM event
 */
async function processMessageEvent(event: any, supabase: any) {
    const { sender, message, timestamp } = event

    if (!sender || !message) {
        console.log('Skipping message event - missing data')
        return
    }

    const { error } = await supabase
        .from('instagram_interactions')
        .insert({
            interaction_type: 'dm',
            instagram_user_id: sender.id,
            instagram_username: sender.id, // Note: Will need to fetch actual username later
            message_content: message.text || null,
            instagram_timestamp: new Date(timestamp).toISOString(),
            metadata: {
                message_id: message.mid,
                attachments: message.attachments || []
            }
        })

    if (error) {
        console.error('Failed to store DM:', error)
    } else {
        console.log(`✓ Stored DM from ${sender.id}`)
    }
}

/**
 * Process comment event
 */
async function processCommentEvent(value: any, supabase: any) {
    if (!value || !value.from) {
        console.log('Skipping comment event - missing data')
        return
    }

    const { error } = await supabase
        .from('instagram_interactions')
        .insert({
            interaction_type: 'comment',
            instagram_user_id: value.from.id,
            instagram_username: value.from.username,
            message_content: value.text,
            instagram_timestamp: new Date(value.created_time * 1000).toISOString(),
            metadata: {
                comment_id: value.id,
                media_id: value.media?.id
            }
        })

    if (error) {
        console.error('Failed to store comment:', error)
    } else {
        console.log(`✓ Stored comment from ${value.from.username}`)
    }
}

/**
 * Process mention event
 */
async function processMentionEvent(value: any, supabase: any) {
    if (!value) {
        console.log('Skipping mention event - missing data')
        return
    }

    const { error } = await supabase
        .from('instagram_interactions')
        .insert({
            interaction_type: 'mention',
            instagram_user_id: value.user_id,
            instagram_username: value.username,
            message_content: `Mentioned in ${value.media_type}`,
            instagram_timestamp: new Date().toISOString(),
            metadata: {
                media_type: value.media_type,
                media_id: value.media_id
            }
        })

    if (error) {
        console.error('Failed to store mention:', error)
    } else {
        console.log(`✓ Stored mention from ${value.username}`)
    }
}
