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

To respect user preferences when sending notifications, check preferences before sending:

```javascript
// Example: Before sending email notification
const [prefs] = await pool.execute(
  'SELECT email_new_answer FROM notification_preferences WHERE user_id = ?',
  [userId]
);

if (prefs[0]?.email_new_answer) {
  // Send email notification
}
```

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
