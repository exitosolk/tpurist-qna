# Notification Preferences Setup Guide

## Overview
The notification preferences feature allows users to customize which notifications they want to receive via email and in-app.

## Database Setup

Run the following SQL script to create the notification preferences table:

```bash
mysql -u your_user -p your_database < database/create-notification-preferences.sql
```

Or execute directly in your MySQL client:
```sql
source database/create-notification-preferences.sql;
```

## Email Configuration

To enable email notifications, configure SMTP settings in your `.env` file:

```env
# SMTP Configuration (required for email notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="OneCeylon" <noreply@oneceylon.space>
NEXT_PUBLIC_BASE_URL=https://oneceylon.space
```

### Gmail Setup
1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password at https://myaccount.google.com/apppasswords
3. Use the App Password as `SMTP_PASS`

### Other SMTP Providers
- **SendGrid**: Use API key as password
- **Mailgun**: Use SMTP credentials from dashboard
- **AWS SES**: Use SMTP credentials from SES console

**Note**: If SMTP is not configured, the system will only create in-app notifications (no emails will be sent).

## Features

### Email Notifications
Users can control email notifications for:
- New answers to their questions
- Comments on their posts
- Question/answer upvotes
- Accepted answers
- Badge earned
- New answers to followed questions

### In-App Notifications
Users can control in-app notifications for:
- New answers
- Comments
- Upvotes (questions and answers)
- Accepted answers
- Badges
- Followed questions

### Digest Preferences
Users can also control:
- Digest frequency (none, daily, weekly)
- What to include in digests (new questions, top questions, followed tags)

## Usage

### Access Notification Preferences
1. Go to Settings page (`/settings`)
2. Click on "Notification Preferences" section
3. Toggle individual preferences as needed

### Default Behavior
- All preferences are created with sensible defaults when a user first accesses them
- Email notifications for important events (new answers, accepted answers, badges) are ON by default
- Less important notifications (downvotes) are OFF by default
- In-app notifications are more permissive by default

### API Endpoints

**GET /api/notifications/preferences**
- Returns current user's notification preferences
- Creates default preferences if none exist

**PATCH /api/notifications/preferences**
- Updates one or more notification preferences
- Accepts any combination of preference fields
- Returns updated preferences

### Example API Usage

```javascript
// Get preferences
const response = await fetch('/api/notifications/preferences');
const { preferences } = await response.json();

// Update preferences
await fetch('/api/notifications/preferences', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email_new_answer: false,
    app_badge_earned: true
  })
});
```

## Integration with Notification System

The system automatically checks user preferences before sending notifications:

1. **In-App Notifications**: Created only if the user hasn't disabled that notification type
2. **Email Notifications**: Sent only if:
   - User's email is verified
   - User has enabled that notification type
   - SMTP is properly configured
   - User has a valid email address

### How It Works

When a notification is triggered (e.g., someone answers your question):

```javascript
await createNotification({
  userId: questionAuthorId,
  type: 'answer',
  actorId: answerAuthorId,
  message: 'John Doe answered your question about Sigiriya',
  questionId: questionId,
  answerId: answerId
});
```

The system will:
1. Check if user wants in-app notifications for this type → Create in-app notification
2. Check if user wants email for this type → Send email (if email is verified)
3. Respect all user preferences automatically

### Automatic Preference Creation

Default preferences are automatically created when:
- User first visits Settings → Notification Preferences
- System checks preferences for sending notifications (fallback to default behavior)

## UI Components

### Settings Page
- Collapsible section for notification preferences
- Separate sections for Email and In-App notifications
- Toggle switches for each notification type
- Success/error messages for updates

## Future Enhancements

Potential improvements:
- Push notifications (web push API)
- SMS notifications for critical events
- Custom notification sounds
- Notification grouping/batching
- Time-based notification schedules (e.g., "Only notify me between 9 AM - 6 PM")
