# Email Sequences Setup Guide

## Overview

The automated email sequence system is now installed! When you send an email to a lead from the CRM, they will automatically be enrolled in a 3-email follow-up sequence.

## Database Setup

**IMPORTANT**: You must run the SQL migration in your Supabase dashboard before the system will work.

1. Go to your Supabase project: https://supabase.com/dashboard
2. Navigate to **SQL Editor**
3. Open the file: `docs/migration-email-sequences.sql`
4. Copy the entire SQL script
5. Paste it into the Supabase SQL Editor
6. Click **Run**

This will create:
- `email_sequences` table (stores email templates)
- `email_sequence_enrollments` table (tracks which leads are in sequences)
- Default "Cold Outreach Follow-up" sequence with 3 emails
- New columns on `leads` table: `in_sequence`, `sequence_paused`

## How It Works

### Automatic Enrollment

When you send an email to a lead from the CRM:
1. Lead is automatically enrolled in the "Cold Outreach Follow-up" sequence
2. A "📧 Sequence" badge appears next to their status in the CRM table
3. Follow-up emails are scheduled automatically

### Email Sequence Timeline

**Email 1** (Manual - you send this):
- Subject: "Quick question about {{business_category}}"
- Sent immediately when you click "Send Email"

**Email 2** (Auto-sent after 2 days):
- Subject: "Re: Quick question about {{business_category}}"
- Sent 2 days after Email 1 (if no reply)

**Email 3** (Auto-sent after 5 days):
- Subject: "Should I close your file?"
- Sent 5 days after Email 1 (if no reply)

### Reply Detection

The system automatically stops sending emails if:
- Lead replies (status changes to "Replied")
- Lead is marked as "Dead"
- Sequence is manually paused

## Cron Job Setup

The sequence processor runs automatically via Vercel Cron:

**Schedule**: Daily at 9:00 AM UTC
**Endpoint**: `/api/sequences/process`
**Configuration**: `vercel.json`

### Manual Trigger (for testing)

You can manually trigger the sequence processor:

```bash
curl https://your-app.vercel.app/api/sequences/process
```

Or visit in browser: `https://your-app.vercel.app/api/sequences/process`

## Testing the Sequence

### Test with Your Own Email

1. Add a test lead to CRM with your email address
2. Send an email to that lead
3. Verify you receive the first email
4. Check that lead shows "📧 Sequence" badge in CRM
5. Manually trigger the cron job (or wait for next day):
   ```bash
   curl http://localhost:3000/api/sequences/process
   ```
6. Verify Email 2 is sent (after 2 days delay)
7. Reply to the email
8. Verify sequence stops (no Email 3 sent)

### Simulate Time Delay (for testing)

To test without waiting 2 days:

1. Send Email 1 to test lead
2. Go to Supabase SQL Editor
3. Run this query to simulate 2 days passing:
   ```sql
   UPDATE email_sequence_enrollments 
   SET last_email_sent_at = NOW() - INTERVAL '2 days'
   WHERE lead_id = 'your_test_lead_id';
   ```
4. Trigger cron job: `curl http://localhost:3000/api/sequences/process`
5. Email 2 should be sent immediately

## API Endpoints

### Enroll Lead in Sequence

```bash
POST /api/sequences/enroll
Content-Type: application/json

{
  "leadId": "lead_123",
  "sequenceId": 1  // Optional, uses default if not provided
}
```

### Unenroll Lead from Sequence

```bash
POST /api/sequences/unenroll
Content-Type: application/json

{
  "leadId": "lead_123",
  "reason": "manual"  // or "replied", "unsubscribed", etc.
}
```

### Process Sequences (Cron Job)

```bash
GET /api/sequences/process
```

Returns:
```json
{
  "success": true,
  "message": "Processed 5 enrollments, sent 3 emails",
  "results": {
    "processed": 5,
    "sent": 3,
    "skipped": 1,
    "completed": 1,
    "unenrolled": 0,
    "errors": []
  }
}
```

## Customizing Email Templates

To edit the email templates:

1. Go to Supabase SQL Editor
2. Run this query to see current templates:
   ```sql
   SELECT * FROM email_sequences WHERE sequence_type = 'cold_outreach';
   ```
3. Update the `emails` JSONB field:
   ```sql
   UPDATE email_sequences 
   SET emails = '[
     {
       "step": 1,
       "delay_days": 0,
       "subject": "Your custom subject",
       "body": "Your custom email body with {{merge_tags}}"
     },
     ...
   ]'::jsonb
   WHERE sequence_type = 'cold_outreach';
   ```

### Available Merge Tags

- `{{name}}` - Lead name
- `{{business_category}}` - Product category
- `{{instagram}}` - Instagram handle
- `{{email}}` - Email address
- `{{store_url}}` - Store URL

## Monitoring

### Check Active Enrollments

```sql
SELECT 
  e.id,
  l.name,
  l.email,
  e.current_step,
  e.enrolled_at,
  e.last_email_sent_at
FROM email_sequence_enrollments e
JOIN leads l ON l.id = e.lead_id
WHERE e.completed_at IS NULL 
  AND e.unenrolled_at IS NULL
ORDER BY e.enrolled_at DESC;
```

### Check Sequence Performance

```sql
SELECT 
  COUNT(*) FILTER (WHERE completed_at IS NOT NULL) as completed,
  COUNT(*) FILTER (WHERE unenrolled_at IS NOT NULL) as unenrolled,
  COUNT(*) FILTER (WHERE completed_at IS NULL AND unenrolled_at IS NULL) as active,
  AVG(EXTRACT(EPOCH FROM (completed_at - enrolled_at))/86400) as avg_days_to_complete
FROM email_sequence_enrollments;
```

## Troubleshooting

### Emails Not Sending

1. **Check SMTP configuration** in `.env.local`:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   ```

2. **Check cron job logs** in Vercel dashboard

3. **Manually trigger** cron job to see errors:
   ```bash
   curl https://your-app.vercel.app/api/sequences/process
   ```

### Sequence Not Stopping After Reply

1. **Verify IMAP reply detection** is working:
   - Check `email-automation/reply-checker.js`
   - Ensure IMAP credentials are in `.env.local`

2. **Manually mark lead as replied**:
   ```sql
   UPDATE leads SET status = 'Replied' WHERE id = 'lead_123';
   ```

### Lead Not Enrolled After Sending Email

1. **Check browser console** for errors
2. **Verify Supabase migration** was run successfully
3. **Check API logs** in `/api/email/send/route.js`

## Next Steps

- Monitor sequence performance for first week
- Adjust email timing based on reply rates
- A/B test different subject lines
- Create additional sequences for different lead types

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check Supabase logs
3. Review browser console for frontend errors
4. Test API endpoints manually with curl
