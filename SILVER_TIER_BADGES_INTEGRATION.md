# Silver Tier Badge Integration Guide

## Overview
This guide explains how to integrate the Silver tier badge award functions into your existing API endpoints.

## Silver Tier Badges

### 1. Price Police 👮
**Requirement**: Flagged content as "Outdated Price" which was confirmed and hidden by the community

**Integration Point**: Review system vote handler
**File**: `app/api/review/vote/route.ts`

```typescript
import { checkPricePoliceBadge } from '@/lib/badges';

// After review is completed and content is flagged as outdated
if (reviewQueue.status === 'completed' && reviewQueue.review_type === 'outdated') {
  const badgeResult = await checkPricePoliceBadge(reviewQueue.flagged_by, reviewQueueId);
  // Badge awarded if this was the user's first successful outdated price flag
}
```

---

### 2. Local Guide 🗺️
**Requirement**: Answered 10 questions within a specific location tag with combined score of 20+

**Integration Point**: Answer submission and vote handlers
**File**: `app/api/answers/route.ts` and vote endpoints

```typescript
import { checkLocalGuideBadge } from '@/lib/badges';

// After answer is created or receives upvote
// Get all tags for the question the answer belongs to
const [tags] = await connection.query(
  `SELECT t.name FROM tags t
   JOIN question_tags qt ON t.id = qt.tag_id
   WHERE qt.question_id = ?`,
  [questionId]
);

// Check badge for each location tag
for (const tag of tags) {
  // You might want to filter for specific location tags
  // e.g., if tag.name matches known Sri Lankan locations
  if (isLocationTag(tag.name)) {
    const badgeResult = await checkLocalGuideBadge(userId, tag.name);
  }
}
```

**Location Tags to Track**: Kandy, Colombo, Galle, Ella, Nuwara Eliya, Sigiriya, Arugam Bay, etc.

---

### 3. Communicator 💬
**Requirement**: Had 5 conversations in comments that led to an accepted answer

**Integration Point**: Answer acceptance handler
**File**: `app/api/answers/[id]/accept/route.ts`

```typescript
import { updateCommunicatorProgress } from '@/lib/badges';

// After an answer is marked as accepted
// Find all users who commented on this answer
const [commenters] = await connection.query(
  `SELECT DISTINCT user_id 
   FROM comments 
   WHERE commentable_type = 'answer' 
     AND commentable_id = ? 
     AND user_id != ?`,
  [answerId, answerAuthorId]
);

// Update progress for each commenter
for (const commenter of commenters) {
  const badgeResult = await updateCommunicatorProgress(commenter.user_id);
}
```

---

### 4. Seasoned Traveler 🔥
**Requirement**: Visited the site 30 days in a row

**Integration Point**: Authentication middleware or layout
**File**: `app/layout.tsx` or `lib/auth.ts`

```typescript
import { updateLoginStreak } from '@/lib/badges';

// In your authentication check or protected route middleware
export async function checkAuthAndUpdateStreak() {
  const session = await getServerSession(authOptions);
  
  if (session?.user?.id) {
    // Update streak on each authenticated page load
    // Function has built-in logic to prevent duplicate updates on same day
    const badgeResult = await updateLoginStreak(session.user.id);
    
    if (badgeResult.awarded) {
      // Optionally show notification to user
      console.log('Seasoned Traveler badge awarded!');
    }
  }
}
```

**Alternative**: Call in API middleware that runs on every authenticated request

---

## Database Migrations

Run these migrations in order:

1. **Add Silver tier badges**:
   ```bash
   mysql -u your_user -p your_database < database/add-silver-tier-badges.sql
   ```

2. **Add login streak tracking to users table**:
   ```bash
   mysql -u your_user -p your_database < database/add-login-streak-tracking.sql
   ```

---

## Testing the Badges

### Price Police
1. Create a test account
2. Flag a comment/answer as "Outdated Price"
3. Have 3 other qualified users vote to confirm it's outdated
4. Badge should be awarded when consensus is reached

### Local Guide
1. Create 10+ answers in questions tagged with "Kandy" (or any location)
2. Ensure combined score is 20+
3. Badge should be awarded on next answer submission or vote

### Communicator
1. Comment on 5 different answers
2. Have those answers be marked as accepted
3. Badge should be awarded when 5th answer is accepted

### Seasoned Traveler
1. Log in daily for 30 consecutive days
2. Badge should be awarded on day 30

---

## Progress Tracking

Two badges use the `badge_progress` table:
- **Communicator**: Tracks count of conversations leading to accepted answers
- **Rice & Curry** (Bronze): Tracks upvote count

Query progress:
```sql
SELECT bp.*, b.name, b.target 
FROM badge_progress bp
JOIN badges b ON bp.badge_id = b.id
WHERE bp.user_id = ?;
```

---

## Additional Considerations

### Location Tags
You may want to create a helper function to identify location tags:

```typescript
const LOCATION_TAGS = [
  'Kandy', 'Colombo', 'Galle', 'Ella', 'Nuwara Eliya', 
  'Sigiriya', 'Arugam Bay', 'Mirissa', 'Trincomalee', 'Anuradhapura'
];

function isLocationTag(tagName: string): boolean {
  return LOCATION_TAGS.includes(tagName);
}
```

### Performance
- The login streak update checks for same-day duplicates to avoid unnecessary DB writes
- Badge award functions check if user already has the badge before inserting
- Consider caching user badge status for frequently checked badges

### Notifications
All badge awards automatically create a notification entry. Make sure your notification system displays badge notifications properly.

---

## Export Functions

Make sure all Silver tier functions are exported from `lib/badges.ts`:

```typescript
export {
  checkPricePoliceBadge,
  checkLocalGuideBadge,
  updateCommunicatorProgress,
  updateLoginStreak
};
```
