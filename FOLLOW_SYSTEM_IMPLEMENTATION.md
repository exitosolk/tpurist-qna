# Follow Questions & Tags Feature - Implementation Summary

## Overview
Implemented a comprehensive "Follow" system that allows users to actively follow questions and tags to receive real-time notifications about updates. This is **separate from bookmarks** (which are for saving content to read later).

## Key Distinction
- **Bookmarks** = Save for later reading (no notifications)
- **Follow** = Get notified about new activity (answers, questions)

---

## Database Changes

### New Tables Created
File: `database/create-question-tag-follows.sql`

1. **question_follows** - Track users following specific questions
   - Indexes on user_id, question_id, created_at
   - Unique constraint to prevent duplicate follows

2. **tag_follows** - Track users following specific tags
   - Indexes on user_id, tag_name
   - Unique constraint per user-tag pair

3. **Notification Types Extended**
   - `followed_question_answer` - New answer on a followed question
   - `followed_tag_question` - New question with a followed tag

### Migration Steps
```sql
-- Run this file to create the new tables
source database/create-question-tag-follows.sql
```

---

## API Endpoints Created

### 1. Follow/Unfollow Questions
**POST** `/api/follows/questions`
- Toggle following a specific question
- Returns: `{ isFollowing: boolean }`

**GET** `/api/follows/questions`
- Get all questions the user is following
- Returns: `{ followedQuestions: [...] }`

### 2. Follow/Unfollow Tags
**POST** `/api/follows/tags`
- Toggle following a specific tag
- Returns: `{ isFollowing: boolean }`

**GET** `/api/follows/tags`
- Get all tags the user is following
- Returns: `{ followedTags: [...] }`

### 3. Check Follow Status
**GET** `/api/follows/check?questionIds=1,2,3&tagNames=visa,ella`
- Check if user is following specific questions or tags
- Returns: `{ questionFollows: {...}, tagFollows: {...} }`

---

## UI Components

### 1. Question Detail Page
**Location:** `app/questions/[id]/page.tsx`

**New Features:**
- **Follow Button** next to Bookmark button
- Purple bell icon (🔔) when following, bell-off icon when not
- Shows "Following" or "Follow" based on state
- Tooltip: "Get notified when new answers are posted"

**Visual:**
```
Share | Bookmark | Follow | Edit | Flag
```

### 2. Tag Pages
**Location:** `app/questions/tagged/[tag]/page.tsx`

**New Features:**
- **Follow Tag Button** in header next to "Ask Question"
- Bell icon with "Following" or "Follow" text
- Shows number of followers (when available)
- Purple highlight when following

### 3. User Profile
**Location:** `app/profile/page.tsx`

**New Tab: "Following"**
- Shows all followed questions with stats (votes, answers, views)
- Shows all followed tags with question counts
- Empty state with helpful prompts
- Organized into two sections:
  - 📝 Followed Questions
  - 🏷️ Followed Tags

---

## Notification System

### When Notifications Are Sent

1. **New Answer on Followed Question**
   - Triggered: When someone posts an answer
   - File: `app/api/questions/[id]/answers/route.ts`
   - Notification type: `followed_question_answer`
   - Message: "answered a question you're following: [title]"
   - Recipients: All users following the question (except the answerer and question owner)

2. **New Question with Followed Tag**
   - Triggered: When a question is posted with a tag
   - File: `app/api/questions/route.ts`
   - Notification type: `followed_tag_question`
   - Message: "asked a new question with tag #[tag]: [title]"
   - Recipients: All users following that specific tag (except the question asker)

### Notification Deduplication
- Question owners get their own notification type (`answer`)
- Followers don't get duplicate notifications if they're also the owner
- Answer authors don't get notified about their own answers

---

## User Experience Flow

### Following a Question
1. User opens a question
2. Clicks "Follow" button (purple bell)
3. Button changes to "Following" with filled bell icon
4. User receives notifications when:
   - New answers are posted
   - (Future: Comments, edits, etc.)

### Following a Tag
1. User navigates to tag page (e.g., `/questions/tagged/visa`)
2. Clicks "Follow" button in header
3. Button changes to "Following"
4. User receives notifications when:
   - New questions are posted with that tag

### Managing Follows
1. User goes to their profile
2. Clicks "Following" tab
3. Sees all followed questions and tags
4. Can click to visit or unfollow

---

## Technical Implementation Details

### Frontend State Management
- Uses React useState for follow status
- Checks follow status on page load
- Optimistic UI updates on toggle
- Error handling with user feedback

### Backend Logic
- SQL queries use DISTINCT to avoid duplicates
- Proper indexing for performance
- Cascade deletes when questions/users are deleted
- Prepared statements to prevent SQL injection

### Performance Considerations
- Indexed foreign keys for fast lookups
- Batch notification creation (avoid N+1 queries)
- Efficient JOIN queries for follower lists

---

## Files Modified

### New Files
1. `database/create-question-tag-follows.sql`
2. `app/api/follows/questions/route.ts`
3. `app/api/follows/tags/route.ts`
4. `app/api/follows/check/route.ts`

### Modified Files
1. `app/questions/[id]/page.tsx` - Added Follow button
2. `app/questions/tagged/[tag]/page.tsx` - Added tag follow
3. `app/api/questions/[id]/answers/route.ts` - Follower notifications
4. `app/api/questions/route.ts` - Tag follower notifications
5. `app/profile/page.tsx` - Following tab
6. `database/create-notifications-table.sql` - New notification types

---

## Testing Checklist

- [ ] Run database migration
- [ ] Follow a question and post an answer - verify notification
- [ ] Follow a tag and post a question - verify notification
- [ ] Unfollow a question - verify no notifications
- [ ] Check Following tab shows correct data
- [ ] Verify bookmark and follow are independent
- [ ] Test with multiple followers
- [ ] Check notification deduplication

---

## Future Enhancements

1. **Email Digests** - Weekly summary of followed content
2. **Notification Preferences** - Control frequency/types
3. **Mute Threads** - Stop notifications without unfollowing
4. **Trending Tags** - Suggest popular tags to follow
5. **Smart Recommendations** - Suggest questions based on activity
6. **Follow Users** - Get notified about user's new questions/answers

---

## SEO & Analytics Impact

- **Engagement Boost:** Users return for notifications
- **Retention:** Following creates ongoing relationship
- **User Sessions:** More visits = better metrics
- **Content Discovery:** Tag following aids exploration

---

## Summary

This feature transforms OneCeylon from a passive Q&A site into an **active community platform**. Users can now:
- Stay updated on topics they care about
- Get notified about travel information relevant to their trip
- Build connections with content over time
- Curate their own feed of Sri Lanka travel info

**Bookmarks** = What I want to read
**Following** = What I want to track

Perfect for tourists planning trips weeks/months in advance! 🏝️
