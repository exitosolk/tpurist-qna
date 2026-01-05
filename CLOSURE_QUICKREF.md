# Question Closure System - Quick Reference

## 🎯 Two Ways to Close Questions

### 1. Community Voting
- **5 votes** from users with **500+ reputation**
- **7 close reasons** available
- **Gold badge holders** can close with **1 vote** (hammer privilege)

### 2. Automatic Closure
- Questions with **score ≤ -5** are auto-closed
- Labeled as `low_quality`
- Configurable threshold

---

## 📋 Close Reasons

1. **duplicate** - Already asked (requires link)
2. **off_topic** - Not about Sri Lanka travel
3. **unclear** - Vague or incomplete
4. **too_broad** - Asks multiple things
5. **opinion_based** - Purely subjective
6. **spam** - Promotional content
7. **outdated_irrelevant** - No longer applicable

---

## 🔧 Quick Setup

### 1. Run Migration
```bash
mysql -u root -p oneceylon < database/create-question-closure-system.sql
```

### 2. Add Auto-Close to Vote Handler
```typescript
import { checkAutoClose } from '@/lib/closure';

// After downvote on question
if (votableType === 'question' && voteType === -1) {
  await checkAutoClose(questionId);
}
```

### 3. Done! ✅

---

## 🚀 API Usage

### Vote to Close
```bash
POST /api/questions/123/close
{
  "closeReasonKey": "unclear",
  "details": "Please specify which cities"
}
```

### Vote to Reopen
```bash
POST /api/questions/123/reopen
{
  "reason": "Question has been edited"
}
```

### Get Status
```bash
GET /api/questions/123/close
GET /api/questions/123/reopen
```

---

## ⚡ Key Features

| Feature | Details |
|---------|---------|
| **Votes Needed** | 5 (configurable) |
| **Min Reputation** | 500 (configurable) |
| **Auto-Close Score** | -5 (configurable) |
| **Vote Aging** | 7 days (configurable) |
| **Quality Strike** | 2.0 strikes for closed question |
| **Rep Reward** | +2 for successful voters |
| **Gold Hammer** | Single-vote closure for gold badge holders |

---

## 💡 Quality Strike Integration

```
Closed Question → 2.0 Strikes → Quality Ban System

Strike Thresholds:
- 3.0 = Warning
- 5.0 = Week ban (includes 2-3 closed questions)
- 8.0 = Month ban (4 closed questions)
- 12.0 = Permanent ban (6 closed questions)
```

---

## 📊 Key Functions

```typescript
// Get config
const config = await getClosureConfig();

// Close question
await closeQuestion(qId, reason, details, userId, isAuto);

// Reopen question
await reopenQuestion(qId, userId);

// Auto-close check
await checkAutoClose(qId);

// Gold hammer check
const hasHammer = await hasGoldBadgeHammer(userId, qId);

// Vote counts
const votes = await getCloseVoteCounts(qId);

// Cleanup
await expireOldCloseVotes();
```

---

## 🎨 UI Integration

```typescript
// Show closed banner
{question.is_closed && (
  <div className="closed-banner">
    Closed as {question.close_reason}
  </div>
)}

// Close button (500+ rep, question not closed)
{canClose && <CloseButton questionId={q.id} />}

// Reopen button (500+ rep, question closed)
{canReopen && <ReopenButton questionId={q.id} />}
```

---

## 📁 Files Created

1. **database/create-question-closure-system.sql** - Schema
2. **lib/closure.ts** - Core functions
3. **app/api/questions/[id]/close/route.ts** - Close API
4. **app/api/questions/[id]/reopen/route.ts** - Reopen API
5. **lib/closure-vote-integration.ts** - Integration example
6. **QUESTION_CLOSURE_SYSTEM.md** - Full documentation

---

## ⚙️ Configuration

```sql
-- Change votes needed
UPDATE closure_config 
SET config_value = '3' 
WHERE config_key = 'close_votes_needed';

-- Change reputation requirement
UPDATE closure_config 
SET config_value = '1000' 
WHERE config_key = 'min_reputation_close';

-- Change auto-close threshold
UPDATE closure_config 
SET config_value = '-10' 
WHERE config_key = 'auto_close_score_threshold';

-- Disable auto-close
UPDATE closure_config 
SET config_value = 'false' 
WHERE config_key = 'auto_close_enabled';
```

---

## 🧪 Testing Checklist

- [ ] 5 users vote to close → question closes
- [ ] Downvote to -5 → auto-closes
- [ ] Gold badge holder closes with 1 vote
- [ ] 5 users vote to reopen → reopens
- [ ] Quality strike (2.0) awarded on close
- [ ] Quality strike removed on reopen
- [ ] Voters get +2 reputation
- [ ] Close votes expire after 7 days
- [ ] Can't vote to close own question
- [ ] Can't vote twice

---

## 🎯 Status

✅ **Fully Implemented**  
✅ **Quality Ban Integrated**  
✅ **Auto-Close Enabled**  
✅ **Community Voting Ready**  
✅ **Gold Hammer Supported**  

**Ready for Production** 🚀
