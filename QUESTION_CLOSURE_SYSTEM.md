# Question Closure System - Complete Guide

## Overview

The OneCeylon question closure system provides two mechanisms for closing low-quality questions:

1. **Community Close Voting** - Users with 500+ reputation can vote to close questions
2. **Automatic Closure** - Questions with score ≤ -5 are automatically closed

Closed questions automatically award **quality strikes** to the question author, contributing to the quality ban system.

---

## Features

✅ **Community-driven closure** with voting system  
✅ **7 close reasons** (duplicate, off-topic, unclear, too broad, opinion-based, spam, outdated)  
✅ **Automatic closure** at -5 score threshold  
✅ **Reopen voting** for closed questions  
✅ **Gold badge hammer** - Single-vote closure privilege  
✅ **Quality strike integration** - Closed questions = 2.0 strikes  
✅ **Reputation rewards** - Voters earn +2 rep when successful  
✅ **Vote aging** - Close votes expire after 7 days  

---

## Database Schema

### New Tables

**`question_close_votes`** - Tracks community close votes  
**`question_reopen_votes`** - Tracks reopen votes  
**`close_reasons`** - Predefined close reasons  
**`closure_config`** - Configurable thresholds  
**`auto_closure_log`** - Analytics for auto-closures  

### Questions Table Updates

Added columns:
- `is_closed` - Boolean flag
- `closed_at` - Timestamp
- `closed_by` - User ID who closed it
- `close_reason` - Reason key
- `close_details` - Additional context
- `auto_closed` - Whether it was auto-closed

---

## Close Reasons

| Reason Key | Display Name | Requires Details | Description |
|-----------|--------------|------------------|-------------|
| `duplicate` | Duplicate | ✅ | Already asked and answered |
| `off_topic` | Off-Topic | ❌ | Not about Sri Lanka travel |
| `unclear` | Unclear What You're Asking | ❌ | Vague or incomplete |
| `too_broad` | Too Broad | ❌ | Asks multiple things |
| `opinion_based` | Opinion-Based | ❌ | Purely subjective |
| `spam` | Spam | ❌ | Spam or promotional |
| `outdated_irrelevant` | No Longer Relevant | ❌ | Outdated information |

---

## Configuration

Default settings in `closure_config` table:

```sql
close_votes_needed = 5           -- Votes required to close
reopen_votes_needed = 5          -- Votes required to reopen
min_reputation_close = 500       -- Rep needed to vote to close
min_reputation_reopen = 500      -- Rep needed to vote to reopen
auto_close_score_threshold = -5  -- Auto-close at this score
auto_close_enabled = true        -- Enable automatic closure
gold_badge_hammer_enabled = true -- Gold badges can close instantly
close_vote_aging_days = 7        -- Votes expire after this
```

### Adjust Configuration

```sql
-- Change votes needed
UPDATE closure_config SET config_value = '3' WHERE config_key = 'close_votes_needed';

-- Change reputation requirement
UPDATE closure_config SET config_value = '1000' WHERE config_key = 'min_reputation_close';

-- Change auto-close threshold
UPDATE closure_config SET config_value = '-10' WHERE config_key = 'auto_close_score_threshold';

-- Disable auto-close
UPDATE closure_config SET config_value = 'false' WHERE config_key = 'auto_close_enabled';
```

---

## API Endpoints

### 1. Vote to Close a Question

**POST** `/api/questions/[id]/close`

**Request Body:**
```json
{
  "closeReasonKey": "unclear",
  "details": "Please specify which cities you're visiting"
}
```

**Response (Vote Recorded):**
```json
{
  "success": true,
  "message": "Close vote recorded (3/5)",
  "closed": false,
  "voteCount": 3,
  "votesNeeded": 5
}
```

**Response (Question Closed):**
```json
{
  "success": true,
  "message": "Question closed successfully",
  "closed": true,
  "voteCount": 5
}
```

**Gold Badge Hammer:**
```json
{
  "success": true,
  "message": "Question closed immediately (gold badge privilege)",
  "closed": true
}
```

---

### 2. Get Close Vote Status

**GET** `/api/questions/[id]/close`

**Response:**
```json
{
  "closeReasons": [
    {
      "id": 1,
      "reasonKey": "duplicate",
      "displayName": "Duplicate",
      "description": "This question has already been asked and answered",
      "requiresDetails": true
    }
  ],
  "voteCounts": [
    {
      "reasonKey": "unclear",
      "reasonDisplayName": "Unclear What You're Asking",
      "voteCount": 3,
      "votesNeeded": 5
    }
  ],
  "votesNeeded": 5,
  "minReputation": 500
}
```

---

### 3. Vote to Reopen a Question

**POST** `/api/questions/[id]/reopen`

**Request Body:**
```json
{
  "reason": "Question has been edited and is now clear"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Reopen vote recorded (2/5)",
  "reopened": false,
  "voteCount": 2,
  "votesNeeded": 5
}
```

---

### 4. Get Reopen Vote Status

**GET** `/api/questions/[id]/reopen`

**Response:**
```json
{
  "voteCount": 2,
  "votesNeeded": 5,
  "minReputation": 500
}
```

---

## Integration Points

### 1. Automatic Closure on Downvote

Add to your voting endpoint (e.g., `app/api/votes/route.ts`):

```typescript
import { checkAutoClose } from '@/lib/closure';

// After applying a downvote to a question
if (votableType === 'question' && voteType === -1) {
  // Update score...
  
  // Check for auto-close
  const wasClosed = await checkAutoClose(questionId);
  
  if (wasClosed) {
    // Optional: Log or notify
    console.log(`Question ${questionId} auto-closed at score ${newScore}`);
  }
}
```

---

### 2. Display Closed Status in UI

When fetching questions, check `is_closed` field:

```typescript
// In your question display component
{question.is_closed && (
  <div className="bg-yellow-100 border border-yellow-400 p-3 rounded">
    <strong>Closed</strong> as {question.close_reason}
    {question.close_details && <p>{question.close_details}</p>}
  </div>
)}
```

---

### 3. Show Close/Reopen Buttons

```typescript
// Check user reputation and question status
const canVoteClose = userReputation >= 500 && !question.is_closed;
const canVoteReopen = userReputation >= 500 && question.is_closed;

{canVoteClose && <button onClick={handleCloseVote}>Vote to Close</button>}
{canVoteReopen && <button onClick={handleReopenVote}>Vote to Reopen</button>}
```

---

### 4. Filter Closed Questions

Add to question queries:

```sql
-- Exclude closed questions from homepage
SELECT * FROM questions 
WHERE is_closed = FALSE 
ORDER BY created_at DESC;

-- Show only closed questions (for moderation)
SELECT * FROM questions 
WHERE is_closed = TRUE 
ORDER BY closed_at DESC;
```

---

## Quality Strike Integration

When a question is closed, the system automatically:

1. ✅ Awards **2.0 quality strikes** to question author
2. ✅ Records in `question_quality_strikes` table
3. ✅ Triggers ban evaluation via `evaluateAndApplyBan()`
4. ✅ Creates notification for question owner

**Strike Values:**
- Downvote: 0.5 strikes
- **Closed: 2.0 strikes** ← New
- Deleted: 3.0 strikes

**Example:**
- 3 closed questions = 6 strikes → **Week ban**
- 4 closed questions = 8 strikes → **Month ban**

---

## Gold Badge Hammer Privilege

Users with **gold tag badges** can close questions with a **single vote** if the question has their gold badge tag.

**Requirements:**
- User has gold badge in at least one of the question's tags
- `gold_badge_hammer_enabled` config is `true`

**How It Works:**
```typescript
// Automatic check in close endpoint
const hasHammer = await hasGoldBadgeHammer(userId, questionId);

if (hasHammer) {
  // Close immediately without waiting for 5 votes
  await closeQuestion(...);
}
```

---

## Close Vote Aging

Close votes expire after **7 days** (configurable) if the question isn't closed.

**Cleanup Task** (run daily via cron):

```typescript
import { expireOldCloseVotes } from '@/lib/closure';

// In your scheduled task
const expired = await expireOldCloseVotes();
console.log(`Expired ${expired} old close votes`);
```

---

## Reopen Process

Closed questions can be reopened by community vote:

1. Question must be edited/improved
2. Users vote to reopen (5 votes default)
3. When threshold met:
   - Question reopened
   - **Quality strike removed**
   - Notification sent to author
   - Voters earn +2 reputation

---

## Notifications

### Question Closed
```
Your question was closed: unclear
Please edit your question to make it clearer and it may be reopened.
```

### Question Reopened
```
Your question was reopened by the community
Thank you for improving your question!
```

### Auto-Closed
```
Your question was automatically closed due to low score (low_quality)
```

---

## Analytics Queries

### Questions Pending Closure

```sql
SELECT * FROM questions_pending_closure
ORDER BY vote_count DESC;
```

### Auto-Closure Statistics

```sql
SELECT 
  DATE(closed_at) as date,
  COUNT(*) as auto_closures,
  AVG(score_at_closure) as avg_score
FROM auto_closure_log
GROUP BY DATE(closed_at)
ORDER BY date DESC;
```

### Top Close Voters

```sql
SELECT 
  u.username,
  COUNT(*) as close_votes,
  SUM(CASE WHEN q.is_closed THEN 1 ELSE 0 END) as successful_closes
FROM question_close_votes qcv
JOIN users u ON qcv.user_id = u.id
JOIN questions q ON qcv.question_id = q.id
WHERE qcv.is_active = TRUE
GROUP BY u.id, u.username
ORDER BY close_votes DESC
LIMIT 20;
```

### Close Reason Distribution

```sql
SELECT 
  cr.display_name,
  COUNT(*) as count
FROM questions q
JOIN close_reasons cr ON q.close_reason = cr.reason_key
WHERE q.is_closed = TRUE
GROUP BY cr.display_name
ORDER BY count DESC;
```

---

## Testing Scenarios

### Test 1: Community Close Vote
1. Create question with low-quality content
2. Have 5 users with 500+ rep vote to close as "unclear"
3. Verify question closed after 5th vote
4. Check quality strike awarded (2.0)
5. Verify voters each got +2 reputation

### Test 2: Automatic Closure
1. Create question
2. Apply 6 downvotes (score = -6)
3. Verify question auto-closed at -5 threshold
4. Check `auto_closure_log` entry
5. Verify quality strike awarded

### Test 3: Gold Badge Hammer
1. User has gold badge in "Kandy" tag
2. Question tagged with "Kandy"
3. User votes to close
4. Verify question closed immediately (single vote)

### Test 4: Reopen Flow
1. Closed question is edited
2. 5 users vote to reopen
3. Verify question reopened after 5th vote
4. Check quality strike removed
5. Verify voters got +2 reputation

---

## Deployment Steps

### 1. Run Database Migration

```bash
mysql -u your_user -p oneceylon < database/create-question-closure-system.sql
```

### 2. Integrate Auto-Close

Add to your vote handler:

```typescript
// In app/api/votes/route.ts or equivalent
import { checkAutoClose } from '@/lib/closure';

// After downvote on question
if (votableType === 'question' && voteType === -1) {
  await checkAutoClose(votableId);
}
```

### 3. Add UI Components

- Close button on questions
- Reopen button on closed questions
- Close vote count display
- Closed question banner

### 4. Set Up Cleanup Cron

```typescript
// Daily task to expire old close votes
import { expireOldCloseVotes } from '@/lib/closure';

// In cron job or scheduled task
await expireOldCloseVotes();
```

### 5. Update Question Queries

Exclude closed questions from main feeds or mark them visually.

---

## Utility Functions Reference

### Core Functions

```typescript
// Get configuration
const config = await getClosureConfig();

// Get available close reasons
const reasons = await getCloseReasons();

// Close a question
await closeQuestion(questionId, reasonKey, details, userId, isAuto);

// Reopen a question
await reopenQuestion(questionId, userId);

// Check auto-close
const wasClosed = await checkAutoClose(questionId);

// Check gold hammer privilege
const hasHammer = await hasGoldBadgeHammer(userId, questionId);

// Get close vote counts
const votes = await getCloseVoteCounts(questionId);

// Check if user voted
const voted = await hasUserVotedToClose(userId, questionId);

// Expire old votes
const expired = await expireOldCloseVotes();
```

---

## Error Handling

### Common Errors

**Already Closed:**
```json
{ "error": "Question is already closed" }
```

**Insufficient Reputation:**
```json
{ "error": "You need 500 reputation to vote to close questions" }
```

**Already Voted:**
```json
{ "error": "You have already voted to close this question" }
```

**Own Question:**
```json
{ "error": "You cannot vote to close your own question" }
```

**Invalid Reason:**
```json
{ "error": "Invalid close reason" }
```

**Missing Details:**
```json
{ "error": "This close reason requires additional details" }
```

---

## Security Considerations

✅ Reputation checks enforced  
✅ Can't close own questions  
✅ Can't vote multiple times  
✅ Gold hammer only for tagged questions  
✅ Quality strikes awarded to question owner  
✅ All actions logged with timestamps  

---

## Performance

- Indexed columns: `is_closed`, `closed_at`, `question_id`
- Views for common queries
- Vote aging prevents unbounded growth
- Efficient queries using JOINs and indexes

---

## Future Enhancements

- [ ] Close queue for moderator review
- [ ] Close vote disputes/appeals
- [ ] More granular close reasons per tag
- [ ] Auto-close based on multiple metrics (not just score)
- [ ] Email notifications for close votes
- [ ] Close history timeline on questions

---

**Status:** ✅ Fully Implemented  
**Version:** 1.0  
**Last Updated:** January 5, 2026
