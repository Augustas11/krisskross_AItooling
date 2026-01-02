import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const DISCORD_WEBHOOK_URL = Deno.env.get("DISCORD_WEBHOOK_URL")

serve(async (req) => {
    try {
        const payload = await req.json()
        const { type, record, old_record } = payload

        if (!DISCORD_WEBHOOK_URL) return new Response("Missing DISCORD_WEBHOOK_URL", { status: 500 })

        // Clean the URL - Discord native doesn't need /slack suffix
        const cleanWebhookUrl = DISCORD_WEBHOOK_URL.replace(/\/slack$/, "")

        const notification = getNotificationPayload(type, record, old_record)
        if (!notification) return new Response("Skipped", { status: 200 })

        const response = await fetch(cleanWebhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(notification),
        })

        if (!response.ok) {
            const err = await response.text()
            return new Response(`Discord Error: ${err}`, { status: 500 })
        }

        return new Response("OK", { status: 200 })
    } catch (e) {
        return new Response(`Error: ${e.message}`, { status: 500 })
    }
})

function getNotificationPayload(type, record, oldRecord) {
    if (type === "INSERT") return createNewLeadEmbed(record)
    if (type === "UPDATE") {
        const oldStatus = oldRecord?.status?.toLowerCase() || ""
        const newStatus = record?.status?.toLowerCase() || ""
        if (oldStatus === newStatus) return null

        if (oldStatus === "new" && (newStatus === "pitched" || newStatus === "emailed")) {
            return createStatusChangeEmbed(record, oldRecord.status, record.status)
        }
        if (newStatus === "replied") return createReplyReceivedEmbed(record, oldRecord.status)
    }
    return null
}

function createCrmLink(leadId: string) {
    const baseUrl = Deno.env.get("CRM_BASE_URL") || "https://krisskross-ai.vercel.app"
    return `${baseUrl}/?leadId=${leadId}`
}

function createNewLeadEmbed(record) {
    const name = record.name || "Unknown Lead"
    const crmLink = createCrmLink(record.id)

    return {
        content: `🆕 **New Lead Discovered!**`,
        embeds: [{
            title: name,
            url: crmLink,
            color: 5814783, // Nice Purple/Blue
            fields: [
                { name: "📧 Email", value: record.email || "N/A", inline: true },
                { name: "📂 Category", value: record.product_category || "N/A", inline: true },
                { name: "🔗 Store URL", value: record.store_url || "N/A" },
                { name: "📍 Source", value: record.source || "Direct", inline: true },
                { name: "📊 Status", value: capitalize(record.status || "New"), inline: true }
            ],
            description: `\n⚡ **[Open Intelligence Card in CRM](${crmLink})**`,
            footer: { text: "KrissKross CRM Intelligence" },
            timestamp: new Date().toISOString()
        }]
    }
}

function createStatusChangeEmbed(record, oldStatus, newStatus) {
    const name = record.name || "Unknown Lead"
    const crmLink = createCrmLink(record.id)

    return {
        content: `📧 **Status Updated: ${name}**`,
        embeds: [{
            title: `Status: ${capitalize(oldStatus)} → ${capitalize(newStatus)}`,
            url: crmLink,
            color: 3447003, // Blue
            description: `Lead **${name}** (${record.email || 'N/A'}) has been moved to ${newStatus}.\n\n🔗 **[View Details in CRM](${crmLink})**`,
            footer: { text: "Outreach Tracking Activated" },
            timestamp: new Date().toISOString()
        }]
    }
}

function createReplyReceivedEmbed(record, previousStatus) {
    const name = record.name || "Unknown Lead"
    const crmLink = createCrmLink(record.id)

    return {
        content: `🔥 **REPLY RECEIVED!**`,
        embeds: [{
            title: `Action Required: ${name}`,
            url: crmLink,
            color: 15548997, // Red/Orange
            fields: [
                { name: "Lead", value: name, inline: true },
                { name: "Email", value: record.email || 'N/A', inline: true },
                { name: "Store", value: record.store_url || 'N/A' },
                { name: "Previous Status", value: capitalize(previousStatus), inline: true },
                { name: "Priority", value: "⚡ High", inline: true }
            ],
            description: `\n🚨 **[Handle Response in CRM](${crmLink})**`,
            footer: { text: "Speed to lead matters!" },
            timestamp: new Date().toISOString()
        }]
    }
}

function capitalize(str) {
    if (!str) return ""
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}
