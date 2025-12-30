# Community Review System Implementation Guide

## Overview

The Community Review System for oneceylon.space enables experienced users to help moderate content and maintain quality through two reputation-tiered review queues.

## Database Setup

1. **Run the SQL migration:**
   ```bash
   mysql -u your_user -p your_database < database/create-review-system.sql
   ```

   This creates the following tables:
   - `review_queue` - Items flagged for review
   - `review_votes` - Individual user votes on review items
   - `content_flags` - Active flags on content (hidden_spam, outdated)
   - `review_thresholds` - Configuration for reputation requirements

## Features

### Tier 1: Scam & Spam Patrol (100+ Reputation)
- **Purpose**: Identify and hide scams, touts, and spam
- **Actions**: Vote to hide or keep flagged content
- **Examples**: Suspicious phone numbers, aggressive advertising, tuk-tuk scams

### Tier 2: Fact Checker (500+ Reputation)
- **Purpose**: Mark outdated information
- **Actions**: Vote to mark content as outdated or current
- **Examples**: Old prices, changed schedules, deprecated information

## Reputation Rewards

- **+1 point**: For each review vote cast
- **+2 bonus points**: When your vote agrees with community consensus (awarded after threshold is met)
- **Threshold**: 3 votes needed for action to be taken

## API Endpoints

### POST `/api/review/flag`
Flag content for community review.

**Request:**
```json
{
  "contentType": "question|answer|comment",
  "contentId": 123,
  "reviewType": "spam_scam|outdated"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Content flagged for review",
  "reviewQueueId": 456
}
```

### GET `/api/review/queue`
Fetch review queue items.

**Query Parameters:**
- `reviewType`: "spam_scam" or "outdated"
- `page`: Page number (default: 1)

**Response:**
```json
{
  "success": true,
  "items": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  },
  "userReputation": 150,
  "minReputation": 100
}
```

### POST `/api/review/vote`
Submit a review vote.

**Request:**
```json
{
  "reviewQueueId": 456,
  "vote": "hide|keep|outdated|current"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Vote recorded successfully"
}
```

## Components

### FlagButton
Use this component to allow users to flag content:

```tsx
import FlagButton from '@/components/FlagButton';

<FlagButton 
  contentType="answer" 
  contentId={answerId}
  compact={false}
  onFlagged={() => refreshContent()}
/>
```

**Props:**
- `contentType`: "question" | "answer" | "comment"
- `contentId`: number
- `compact`: boolean (optional, default: false)
- `onFlagged`: callback function (optional)

### ContentFlagWarning
Display warnings when content has been flagged:

```tsx
import ContentFlagWarning from '@/components/ContentFlagWarning';

{contentFlag && (
  <ContentFlagWarning 
    flagType={contentFlag.flag_type}
    compact={false}
  />
)}
```

**Props:**
- `flagType`: "hidden_spam" | "outdated"
- `compact`: boolean (optional, default: false)

## Integration Steps

### 1. Add Flag Button to Content

Add the FlagButton component to answers, comments, and questions:

```tsx
// In question detail page
import FlagButton from '@/components/FlagButton';

// Add after other action buttons (Share, Edit, Bookmark, etc.)
<FlagButton 
  contentType="answer" 
  contentId={answer.id}
/>
```

### 2. Fetch and Display Content Flags

Update your content fetching queries to include flag information:

```sql
SELECT 
  a.*,
  cf.flag_type,
  cf.is_active as is_flagged
FROM answers a
LEFT JOIN content_flags cf ON cf.content_type = 'answer' 
  AND cf.content_id = a.id 
  AND cf.is_active = TRUE
WHERE a.question_id = ?
```

Then display warnings:

```tsx
import ContentFlagWarning from '@/components/ContentFlagWarning';

{answer.is_flagged && (
  <ContentFlagWarning flagType={answer.flag_type} />
)}
```

### 3. Add Navigation Link

Add a link to the review queue in the Navbar for users with sufficient reputation:

```tsx
{session && userReputation >= 100 && (
  <Link href="/review" className="text-gray-700 hover:text-blue-600">
    Review Queue
    {reviewQueueCount > 0 && (
      <span className="ml-1 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
        {reviewQueueCount}
      </span>
    )}
  </Link>
)}
```

## Configuration

You can adjust the reputation thresholds and vote requirements in the database:

```sql
UPDATE review_thresholds 
SET min_reputation = 200, votes_needed = 5
WHERE review_type = 'spam_scam';
```

## Handling Hidden Content

Content flagged as `hidden_spam` should be:
1. Hidden from normal users
2. Visible to moderators/admins (for audit)
3. Shown with a strong warning if displayed

Content flagged as `outdated` should be:
1. Displayed normally
2. Shown with a warning banner at the top
3. Sorted lower in answer lists (optional)

## Example SQL Queries

### Get content with flags
```sql
SELECT 
  a.*,
  cf.flag_type,
  cf.flagged_at,
  cf.is_active
FROM answers a
LEFT JOIN content_flags cf ON cf.content_type = 'answer' 
  AND cf.content_id = a.id 
  AND cf.is_active = TRUE
WHERE a.question_id = ?
```

### Hide spam content from regular users
```sql
SELECT a.*
FROM answers a
LEFT JOIN content_flags cf ON cf.content_type = 'answer' 
  AND cf.content_id = a.id 
  AND cf.flag_type = 'hidden_spam'
  AND cf.is_active = TRUE
WHERE a.question_id = ?
  AND cf.id IS NULL  -- Exclude hidden spam
```

## Best Practices

1. **False Flagging**: Monitor users who frequently flag content that gets rejected by the community. Consider penalties for abuse.

2. **Appeal System**: Future enhancement to allow content authors to appeal flags.

3. **Moderator Override**: Admins should be able to manually approve/reject review items.

4. **Analytics**: Track review queue metrics to understand community health.

5. **Notifications**: Notify content authors when their content is flagged and when action is taken.

## Maintenance

- Regularly archive completed reviews older than 30 days
- Monitor review queue sizes and adjust thresholds if needed
- Review flagged content patterns to identify systemic issues

## Future Enhancements

1. **Auto-detection**: Automatically flag content with phone numbers or suspicious patterns
2. **Badges**: Award badges for helpful reviewers
3. **Review history**: Let users see their review accuracy over time
4. **Smart queueing**: Prioritize items that need urgent attention
5. **Machine learning**: Use ML to pre-screen potential spam
