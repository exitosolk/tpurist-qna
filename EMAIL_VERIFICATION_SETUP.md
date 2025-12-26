# Email Verification Setup

This guide explains how to set up email verification for OneCeylon.

## Database Migration

First, run the database migration to add email verification columns:

```bash
mysql -u your_username -p oneceylon < database/add-email-verification.sql
```

Or manually in MySQL:

```sql
ALTER TABLE users 
  ADD COLUMN email_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN verification_token VARCHAR(255) DEFAULT NULL,
  ADD COLUMN verification_token_expires TIMESTAMP NULL DEFAULT NULL;

CREATE INDEX idx_verification_token ON users(verification_token);
```

## Email Configuration

### Gmail Setup (Recommended for Development)

1. **Enable 2-Factor Authentication:**
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Enable 2-Step Verification

2. **Generate App Password:**
   - Go to [App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" and "Other" (name it "OneCeylon")
   - Copy the 16-character password

3. **Update `.env` file:**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-16-char-app-password
   SMTP_FROM="OneCeylon" <noreply@oneceylon.space>
   NEXTAUTH_URL=http://localhost:3000
   ```

### Other Email Providers

#### Outlook/Hotmail
```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-password
```

#### Yahoo Mail
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_USER=your-email@yahoo.com
SMTP_PASSWORD=your-app-password
```

#### SendGrid (Production Recommended)
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
```

#### Mailgun
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your-mailgun-username
SMTP_PASSWORD=your-mailgun-password
```

## Testing Email Verification

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Create a new account or log in**

3. **Go to your profile page** - You should see a yellow banner asking you to verify your email

4. **Click "Send Verification Email"** - Check your inbox for the verification email

5. **Click the verification link** - You should be redirected to a success page and earn 10 reputation points

## Features

- ✅ Email verification required for full platform access
- ✅ Users earn **10 reputation points** for verifying their email
- ✅ Verification links expire after 24 hours
- ✅ Profile editing (display name and bio)
- ✅ Email verification banner on profile page
- ✅ Resend verification email option

## Troubleshooting

### Email not sending

1. **Check SMTP credentials:**
   - Verify `SMTP_USER` and `SMTP_PASSWORD` are correct
   - For Gmail, ensure you're using an App Password, not your regular password

2. **Check server logs:**
   - Look for error messages in the terminal
   - Common errors: "Invalid login", "Connection timeout"

3. **Test SMTP connection:**
   - Use an online SMTP tester to verify your credentials work

### Verification link not working

1. **Check `NEXTAUTH_URL`:**
   - Should match your actual URL (e.g., `http://localhost:3000` for development)
   - In production: `https://oneceylon.space`

2. **Check token expiration:**
   - Tokens expire after 24 hours
   - Request a new verification email

## Production Deployment

For production, it's recommended to use a transactional email service:

- **SendGrid** (Free tier: 100 emails/day)
- **Mailgun** (Free tier: 5,000 emails/month)
- **Amazon SES** (Cheap, $0.10 per 1,000 emails)
- **Postmark** (Free tier: 100 emails/month)

These services provide:
- Better deliverability
- Email analytics
- No risk of Gmail blocking
- Professional sender reputation
