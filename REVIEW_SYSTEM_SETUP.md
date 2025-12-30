# 🛡️ Community Review System - Quick Setup

## Overview

A two-tier community moderation system that enables experienced users to maintain content quality and protect tourists from scams and outdated information.

## ⚡ Quick Start (5 Minutes)

### Step 1: Run Database Migration

```bash
mysql -u root -p oneceylon < database/create-review-system.sql
```

Or from MySQL prompt:
```sql
USE oneceylon;
source database/create-review-system.sql;
```

### Step 2: Verify Tables Created

```sql
SHOW TABLES LIKE 'review%';
-- Should show: review_queue, review_votes, review_thresholds

SELECT * FROM review_thresholds;
-- Should show 2 rows: spam_scam (100 rep), outdated (500 rep)
```

### Step 3: Test the Review Queue

1. Login with an account that has 100+ reputation
2. Navigate to `/review` 
3. You should see the review queue interface

### Step 4: Test Flagging Content

1. View any question or answer
2. Add the FlagButton component (see integration examples below)
3. Click the flag button and select a flag type
4. Content should appear in the review queue

## 📁 What Was Created

### Backend (API Routes)
```
app/api/review/
├── flag/route.ts      # Flag content for review
├── queue/route.ts     # Get review queue items  
├── vote/route.ts      # Submit review votes
└── stats/route.ts     # Get queue statistics
```

### Frontend
```
app/review/page.tsx                   # Review queue interface
components/FlagButton.tsx             # Flag content button
components/ContentFlagWarning.tsx     # Warning banners
```

### Database
```
database/create-review-system.sql     # Complete schema
```

## 🎯 How To Use

### For End Users

**Tier 1: Scam & Spam Patrol (100+ rep)**
- Click "Review" in navbar
- Review flagged scams/spam
- Vote to hide or keep content

**Tier 2: Fact Checker (500+ rep)**  
- Access "Fact Checker" tab
- Review outdated content
- Vote to mark as outdated or current

### For Developers: Integration

#### Add Flag Button to Content

```tsx
import FlagButton from '@/components/FlagButton';

// In your question/answer component
<FlagButton 
  contentType="answer" 
  contentId={answer.id}
  compact={true}
/>
```

#### Display Warnings on Flagged Content

```tsx
import ContentFlagWarning from '@/components/ContentFlagWarning';

// At top of flagged content
{answer.is_flagged && (
  <ContentFlagWarning flagType={answer.flag_type} />
)}
```

#### Fetch Content Flags

```sql
-- Update your queries to include flag info
SELECT 
  a.*,
  cf.flag_type,
  cf.is_active as is_flagged
FROM answers a
LEFT JOIN content_flags cf ON 
  cf.content_type = 'answer' 
  AND cf.content_id = a.id 
  AND cf.is_active = TRUE
WHERE a.question_id = ?
```

## 🔧 Configuration

### Change Reputation Requirements

```sql
-- Require 200 rep for spam reviews
UPDATE review_thresholds 
SET min_reputation = 200
WHERE review_type = 'spam_scam';

-- Require 5 votes instead of 3
UPDATE review_thresholds 
SET votes_needed = 5
WHERE review_type = 'outdated';
```

### Add More Reputation Events

```sql
-- Reward reviewers more
UPDATE reputation_events 
SET points = 5 
WHERE event_type = 'review_helpful';
```

## 🧪 Testing

### Test Flagging
```bash
curl -X POST http://localhost:3000/api/review/flag \
  -H "Content-Type: application/json" \
  -d '{
    "contentType": "answer",
    "contentId": 1,
    "reviewType": "spam_scam"
  }'
```

### Test Getting Queue
```bash
curl http://localhost:3000/api/review/queue?reviewType=spam_scam&page=1
```

### Test Voting
```bash
curl -X POST http://localhost:3000/api/review/vote \
  -H "Content-Type: application/json" \
  -d '{
    "reviewQueueId": 1,
    "vote": "hide"
  }'
```

## 📊 Monitoring

### Check Review Activity

```sql
-- Pending reviews
SELECT review_type, COUNT(*) 
FROM review_queue 
WHERE status = 'pending' 
GROUP BY review_type;

-- Top reviewers
SELECT u.username, COUNT(*) as review_count
FROM review_votes rv
JOIN users u ON rv.user_id = u.id
GROUP BY u.id
ORDER BY review_count DESC
LIMIT 10;

-- Recent actions
SELECT * 
FROM review_queue 
WHERE status IN ('approved', 'rejected')
ORDER BY resolution_at DESC 
LIMIT 20;
```

### View Active Flags

```sql
-- All active content flags
SELECT 
  cf.content_type,
  cf.content_id,
  cf.flag_type,
  cf.flagged_at,
  CASE 
    WHEN cf.content_type = 'question' THEN q.title
    WHEN cf.content_type = 'answer' THEN SUBSTRING(a.body, 1, 100)
    WHEN cf.content_type = 'comment' THEN c.body
  END as content_preview
FROM content_flags cf
LEFT JOIN questions q ON cf.content_type = 'question' AND cf.content_id = q.id
LEFT JOIN answers a ON cf.content_type = 'answer' AND cf.content_id = a.id  
LEFT JOIN comments c ON cf.content_type = 'comment' AND cf.content_id = c.id
WHERE cf.is_active = TRUE;
```

## 🐛 Troubleshooting

### "Review type not configured" error
```sql
-- Re-insert thresholds
DELETE FROM review_thresholds;
INSERT INTO review_thresholds (review_type, min_reputation, votes_needed, description) VALUES
('spam_scam', 100, 3, 'Scam & Spam Patrol'),
('outdated', 500, 3, 'Fact Checker');
```

### "User not found" error
- Ensure user is logged in
- Check session.user.id is populated

### Review queue empty but items exist
```sql
-- Check pending items
SELECT * FROM review_queue WHERE status = 'pending';

-- Reset a review for testing
UPDATE review_queue SET status = 'pending' WHERE id = 1;
```

## 📚 Documentation

- **[REVIEW_SYSTEM_SUMMARY.md](REVIEW_SYSTEM_SUMMARY.md)** - Complete overview
- **[REVIEW_SYSTEM_GUIDE.md](REVIEW_SYSTEM_GUIDE.md)** - Detailed API reference
- **[REVIEW_SYSTEM_INTEGRATION.md](REVIEW_SYSTEM_INTEGRATION.md)** - Code examples

## ✅ Checklist

- [ ] Database migration run successfully
- [ ] Review queue page accessible at `/review`
- [ ] "Review" link appears in navbar for logged-in users
- [ ] Can flag content (test with answer/question)
- [ ] Flagged items appear in review queue
- [ ] Can vote on review items
- [ ] Vote counts update correctly
- [ ] Actions applied when threshold reached (3 votes)
- [ ] Reputation awarded for reviews
- [ ] ContentFlagWarning displays on flagged content
- [ ] FlagButton appears on content items

## 🚀 Production Checklist

Before deploying to production:

- [ ] Backup database before running migration
- [ ] Test with real user accounts of varying reputation
- [ ] Configure appropriate reputation thresholds for your community
- [ ] Set up monitoring for review queue metrics
- [ ] Plan for handling disputes/appeals
- [ ] Document internal moderation procedures
- [ ] Train moderators on new system
- [ ] Announce feature to community
- [ ] Monitor for false flagging patterns

## 💡 Tips

1. **Start conservative**: Begin with higher reputation requirements, lower them based on community response
2. **Monitor actively**: Watch the first week of reviews closely
3. **Reward reviewers**: Consider badges or special recognition for helpful reviewers
4. **Communicate clearly**: Explain the system to users in FAQ/help section
5. **Iterate**: Adjust thresholds based on what works for your community

---

**Need help?** Check the detailed guides or review the example code in REVIEW_SYSTEM_INTEGRATION.md
