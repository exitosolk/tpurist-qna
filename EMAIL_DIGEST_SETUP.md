# Email Digest System - Setup Guide

## Overview

The email digest system sends periodic summaries of new activity on followed questions and tags. Users can choose to receive digests daily, weekly, or never.

## Features

- **Configurable Frequency**: Users can select daily, weekly, or never
- **Smart Content**: Only sends emails when there's new activity
- **Followed Questions**: New answers on questions the user follows
- **Followed Tags**: New questions in tags the user follows
- **Preview**: Users can preview how their digest will look
- **Batch Processing**: Cron-friendly endpoint for sending to multiple users

## Database Setup

### 1. Run the Database Migration

```bash
# Connect to your MySQL database
mysql -u your_username -p your_database

# Run the migration
source database/add-email-digest-preferences.sql
```

This adds:
- `digest_frequency` ENUM column ('never', 'daily', 'weekly') - default 'weekly'
- `last_digest_sent_at` TIMESTAMP column to track when digest was last sent
- Index on `digest_frequency` and `last_digest_sent_at` for efficient queries

## Environment Variables

Add these to your `.env.local` file:

```env
# SMTP Configuration for sending emails
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@oneceylon.com

# Cron job secret (for security)
CRON_SECRET=your-random-secret-token-here

# Base URL for links in emails
NEXT_PUBLIC_BASE_URL=https://oneceylon.space
```

### Gmail Setup (if using Gmail)

1. Enable 2-factor authentication on your Google account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
   - Use this as `SMTP_PASS`

### Other Email Providers

For SendGrid, Mailgun, AWS SES, etc., update the SMTP settings accordingly.

## User Interface

### Settings Page

Users can manage their digest preferences at `/settings`:

- **Weekly Digest** (Recommended): Sends once per week
- **Daily Digest**: Sends once per day
- **Never**: Disables digest emails

The preference is saved immediately when selected.

### Preview Link

Users can preview their digest email by clicking the "Preview digest email →" link in settings.

## API Endpoints

### 1. Update Digest Preferences

**Endpoint**: `PATCH /api/settings`

**Body**:
```json
{
  "digest_frequency": "weekly" // or "daily" or "never"
}
```

**Response**:
```json
{
  "message": "Settings updated successfully",
  "digest_updated": true
}
```

### 2. Preview Digest (User)

**Endpoint**: `GET /api/digest/preview?frequency=weekly`

**Authentication**: Required (session)

**Response**: HTML email preview rendered in browser

### 3. Send Test Digest (User)

**Endpoint**: `POST /api/digest/send`

**Authentication**: Required (session)

**Body**:
```json
{
  "frequency": "weekly" // or "daily"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Digest email sent successfully"
}
```

### 4. Batch Send Digests (Cron)

**Endpoint**: `GET /api/digest/send?frequency=daily`

**Authentication**: Bearer token (CRON_SECRET)

**Headers**:
```
Authorization: Bearer your-cron-secret
```

**Query Parameters**:
- `frequency`: "daily" or "weekly"

**Response**:
```json
{
  "success": true,
  "message": "Sent 45 digests, 2 failed",
  "sent": 45,
  "failed": 2,
  "total": 47
}
```

## Cron Job Setup

### Option 1: Vercel Cron Jobs

1. Create `vercel.json` in your project root:

```json
{
  "crons": [
    {
      "path": "/api/digest/send?frequency=daily",
      "schedule": "0 8 * * *"
    },
    {
      "path": "/api/digest/send?frequency=weekly",
      "schedule": "0 8 * * 1"
    }
  ]
}
```

2. Add the `CRON_SECRET` environment variable in Vercel dashboard

3. Deploy - Vercel will automatically set up the cron jobs

### Option 2: External Cron Service (EasyCron, cron-job.org)

1. Sign up for a cron service
2. Create two jobs:

**Daily Digest**:
- URL: `https://yourdomain.com/api/digest/send?frequency=daily`
- Schedule: Daily at 8:00 AM
- Headers: `Authorization: Bearer your-cron-secret`

**Weekly Digest**:
- URL: `https://yourdomain.com/api/digest/send?frequency=weekly`
- Schedule: Every Monday at 8:00 AM
- Headers: `Authorization: Bearer your-cron-secret`

### Option 3: Server Crontab

If hosting on your own server:

```bash
# Edit crontab
crontab -e

# Add these lines:
# Daily digest at 8 AM
0 8 * * * curl -H "Authorization: Bearer your-cron-secret" https://yourdomain.com/api/digest/send?frequency=daily

# Weekly digest every Monday at 8 AM
0 8 * * 1 curl -H "Authorization: Bearer your-cron-secret" https://yourdomain.com/api/digest/send?frequency=weekly
```

## Email Template

The digest email includes:

### Header
- OneCeylon branding
- Gradient header with "Your Weekly/Daily Digest"

### Questions You Follow
- Shows questions with new answers
- Displays number of new answers
- Links to each question

### Tags You Follow
- Shows new questions in followed tags
- Groups by tag name
- Shows up to 3 questions per tag
- Link to view all questions in tag

### Footer
- Unsubscribe/settings link
- OneCeylon branding

## Smart Delivery Logic

The system only sends digest emails when:

1. User has `digest_frequency` set to "daily" or "weekly"
2. User's email is verified
3. User hasn't received a digest recently:
   - Daily: At least 20 hours since last digest
   - Weekly: At least 6 days since last digest
4. There's actual content to send:
   - New answers on followed questions, OR
   - New questions in followed tags
5. Content is from the period since last digest was sent

## Testing

### 1. Test Email Configuration

```bash
# Send a test digest to yourself
curl -X POST https://localhost:3000/api/digest/send \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{"frequency": "weekly"}'
```

### 2. Preview Email in Browser

Navigate to: `https://localhost:3000/api/digest/preview?frequency=weekly`

### 3. Check Logs

The API endpoints log useful information:
- Number of users processed
- Emails sent/failed
- Errors encountered

## Troubleshooting

### Emails Not Sending

1. **Check SMTP credentials**: Verify `SMTP_USER` and `SMTP_PASS`
2. **Check firewall**: Ensure outbound port 587 (or 465) is open
3. **Check logs**: Look for error messages in console/logs
4. **Test SMTP**: Use a tool like `telnet smtp.gmail.com 587`

### Users Not Receiving Digests

1. **Verify email**: User must have verified their email
2. **Check frequency**: User must have set digest_frequency to "daily" or "weekly"
3. **Check spam folder**: Emails might be filtered
4. **Check last_digest_sent_at**: System prevents sending too frequently

### Empty Digests

This is normal! Digests are only sent when there's new activity. If a user follows questions/tags with no new content, no email is sent.

## Performance Considerations

- **Batch Size**: The cron endpoint processes up to 100 users per run
- **Rate Limiting**: 100ms delay between emails to avoid SMTP rate limits
- **Indexing**: Database indexes on `digest_frequency` and `last_digest_sent_at`
- **Efficient Queries**: Uses JOINs to minimize database calls

## Security

- **Cron Secret**: Protects batch endpoint from unauthorized access
- **Session Auth**: User endpoints require valid session
- **Email Verification**: Only sends to verified emails
- **SQL Injection**: Uses parameterized queries
- **XSS Protection**: Email templates use safe HTML

## Future Enhancements

Potential improvements:

1. **Immediate notifications**: Option for instant email on followed content
2. **Digest customization**: Let users choose which types of content to include
3. **Digest stats**: Show open rates, click rates
4. **Unsubscribe link**: One-click unsubscribe without login
5. **Time zone support**: Send at user's preferred time
6. **Mobile app**: Push notifications instead of email

## Support

If you encounter issues:

1. Check the setup steps above
2. Review error logs
3. Test SMTP configuration
4. Verify environment variables
5. Check database migration ran successfully

---

**Last Updated**: December 2024
**Version**: 1.0
