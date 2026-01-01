# Email Digest System - Quick Start

## What Was Built

A complete email digest system that sends automated summaries of followed content to users.

## Files Created

1. **`lib/email-digest.ts`** - Email template generator (375 lines)
2. **`app/api/digest/send/route.ts`** - Send digest API (292 lines)
3. **`app/api/digest/preview/route.ts`** - Preview digest API (141 lines)
4. **`database/add-email-digest-preferences.sql`** - Database migration
5. **`EMAIL_DIGEST_SETUP.md`** - Comprehensive setup guide
6. **`EMAIL_DIGEST_SUMMARY.md`** - Feature summary
7. **`EMAIL_DIGEST_QUICKSTART.md`** - This file

## Files Modified

1. **`app/settings/page.tsx`** - Added digest preferences UI
2. **`app/api/settings/route.ts`** - Handle digest_frequency updates

## Quick Deployment (5 Steps)

### Step 1: Database Migration

```bash
# Connect to MySQL
mysql -u your_user -p your_database

# Run migration
source database/add-email-digest-preferences.sql
```

### Step 2: Environment Variables

Add to `.env.local`:

```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
SMTP_FROM=noreply@oneceylon.com

# Cron Security
CRON_SECRET=generate-random-secret-here

# Base URL
NEXT_PUBLIC_BASE_URL=https://oneceylon.space
```

**Gmail App Password**: 
1. Go to https://myaccount.google.com/apppasswords
2. Generate a password for "Mail"
3. Use that as `SMTP_PASS`

### Step 3: Test Locally

```bash
# Start dev server
npm run dev

# 1. Change your digest preference
# Visit: http://localhost:3000/settings
# Select "Weekly Digest"

# 2. Preview the email
# Visit: http://localhost:3000/api/digest/preview

# 3. Send test digest
# Open browser console and run:
fetch('/api/digest/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ frequency: 'weekly' })
}).then(r => r.json()).then(console.log)

# 4. Check your email inbox
```

### Step 4: Deploy to Production

```bash
# Add environment variables to your hosting provider
# (Vercel, Railway, AWS, etc.)

# Deploy
git add .
git commit -m "Add email digest system"
git push
```

### Step 5: Setup Cron Jobs

**Option A: Vercel Cron Jobs** (Recommended)

Create `vercel.json`:

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

Then deploy - Vercel handles the rest!

**Option B: External Cron Service** (cron-job.org, EasyCron)

1. Create account at cron-job.org
2. Add two jobs:

**Daily Digest**:
- URL: `https://yourdomain.com/api/digest/send?frequency=daily`
- Schedule: `0 8 * * *` (8 AM daily)
- Custom Headers: `Authorization: Bearer your-cron-secret`

**Weekly Digest**:
- URL: `https://yourdomain.com/api/digest/send?frequency=weekly`
- Schedule: `0 8 * * 1` (8 AM every Monday)
- Custom Headers: `Authorization: Bearer your-cron-secret`

## How Users Use It

1. **Go to Settings**: User visits `/settings`
2. **Choose Frequency**: Select Weekly, Daily, or Never
3. **Get Digests**: Automatically receive emails when there's new activity

## What Gets Sent

Users receive emails containing:

- **New answers** on questions they follow
- **New questions** in tags they follow
- **Only when there's activity** (no spam!)

## Verifying It Works

### Check Digest Was Sent

```sql
-- See when digests were last sent
SELECT username, email, digest_frequency, last_digest_sent_at
FROM users
WHERE digest_frequency != 'never'
ORDER BY last_digest_sent_at DESC
LIMIT 10;
```

### Check User Preferences

```sql
-- Count users by preference
SELECT digest_frequency, COUNT(*) as user_count
FROM users
GROUP BY digest_frequency;
```

### Test Batch Send (Manually)

```bash
# Trigger batch send manually (use your CRON_SECRET)
curl -X GET "https://yourdomain.com/api/digest/send?frequency=daily" \
  -H "Authorization: Bearer your-cron-secret"
```

## Troubleshooting

### ❌ Emails Not Sending

**Check SMTP credentials**:
```bash
# Test SMTP connection
telnet smtp.gmail.com 587
```

**Check environment variables**:
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` all set?
- Gmail App Password generated?

### ❌ Users Not Getting Digests

**Verify user settings**:
```sql
SELECT username, email, email_verified, digest_frequency 
FROM users 
WHERE id = YOUR_USER_ID;
```

Requirements:
- `email_verified = TRUE`
- `digest_frequency != 'never'`
- User follows some questions/tags
- There's new activity on followed content

### ❌ Empty Digest

This is normal! Digests only send when there's new activity. If no new answers/questions, no email is sent.

## Cost

**Free Tier (Gmail)**: 500 emails/day - sufficient for most sites

**Estimated usage**:
- 100 users: ~30 emails/day (if 30% daily, 70% weekly)
- 1,000 users: ~300 emails/day
- 10,000 users: ~3,000 emails/day (need paid service)

## Monitoring

### View Logs

Check your hosting provider's logs for:
- `Digest sent successfully to user X`
- `No digest content for user X`
- Errors (SMTP issues, etc.)

### Analytics to Track

- Number of digests sent per day
- Delivery success rate
- Users changing preferences
- Email open rates (requires tracking pixels)

## Next Steps

✅ **Feature is complete and ready to use!**

Optional improvements:
1. Add email tracking (open rates, clicks)
2. Add one-click unsubscribe
3. Customize email content per user
4. Add push notifications as alternative
5. Show digest stats in user profile

## Support

For issues, check:
1. **EMAIL_DIGEST_SETUP.md** - Detailed setup guide
2. **EMAIL_DIGEST_SUMMARY.md** - Feature overview
3. Environment variables are correct
4. Database migration ran successfully
5. SMTP connection works

---

**Status**: ✅ Production Ready
**Time to Deploy**: ~15 minutes
**Difficulty**: Easy (just follow the steps)

Happy emailing! 📧🏝️
