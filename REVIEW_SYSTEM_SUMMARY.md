# Community Review System - Implementation Summary

## ✅ What's Been Implemented

A complete two-tier community moderation system for oneceylon.space that allows experienced users to help maintain content quality and safety.

### 📁 Files Created

#### Database
- **[create-review-system.sql](database/create-review-system.sql)** - Complete database schema with tables for review queues, votes, content flags, and configuration

#### API Endpoints
- **[api/review/flag/route.ts](app/api/review/flag/route.ts)** - Flag content for community review
- **[api/review/queue/route.ts](app/api/review/queue/route.ts)** - Fetch review queue items based on reputation tier
- **[api/review/vote/route.ts](app/api/review/vote/route.ts)** - Submit review votes and apply actions when threshold is met

#### Frontend Pages
- **[app/review/page.tsx](app/review/page.tsx)** - Full review queue interface with tabs for both tiers

#### Components
- **[components/FlagButton.tsx](components/FlagButton.tsx)** - Reusable button to flag content as spam/scam or outdated
- **[components/ContentFlagWarning.tsx](components/ContentFlagWarning.tsx)** - Display warnings for flagged content

#### Documentation
- **[REVIEW_SYSTEM_GUIDE.md](REVIEW_SYSTEM_GUIDE.md)** - Complete usage guide and API reference
- **[REVIEW_SYSTEM_INTEGRATION.md](REVIEW_SYSTEM_INTEGRATION.md)** - Integration examples for existing pages

#### Updated Files
- **[components/Navbar.tsx](components/Navbar.tsx)** - Added "Review" link for authenticated users

---

## 🎯 Features

### Tier 1: Scam & Spam Patrol (100+ Reputation)
- **Purpose**: Identify tuk-tuk scams, touts, and spam
- **Actions**: Vote to hide or keep flagged content
- **Use cases**: Suspicious phone numbers, aggressive advertising, tour touts

### Tier 2: Fact Checker (500+ Reputation)  
- **Purpose**: Mark outdated travel information
- **Actions**: Vote to mark content as outdated or current
- **Use cases**: Old prices, changed schedules, deprecated information

### Reputation System
- **+1 point** for each review vote cast
- **+2 bonus points** when your vote matches community consensus
- **3 votes required** for action to be taken on flagged content

---

## 🚀 Getting Started

### 1. Database Setup

```bash
# Run the SQL migration
mysql -u your_user -p your_database < database/create-review-system.sql
```

This creates:
- `review_queue` - Items flagged for review
- `review_votes` - Individual user votes
- `content_flags` - Active flags on content
- `review_thresholds` - Reputation requirements configuration

### 2. Access the Review Queue

Navigate to `/review` to access the review queue interface (requires login with 100+ reputation).

### 3. Integrate Flag Buttons

Add flag buttons to your content pages:

```tsx
import FlagButton from '@/components/FlagButton';

<FlagButton 
  contentType="answer"  // or "question", "comment"
  contentId={answerId}
  compact={false}
  onFlagged={() => refreshContent()}
/>
```

### 4. Display Content Warnings

Show warnings for flagged content:

```tsx
import ContentFlagWarning from '@/components/ContentFlagWarning';

{answer.is_flagged && (
  <ContentFlagWarning flagType={answer.flag_type} />
)}
```

---

## 📊 How It Works

### Flagging Process

1. User with sufficient reputation clicks "Flag" button on content
2. Selects flag type: "Scam/Spam" or "Outdated"
3. Content is added to appropriate review queue
4. Flagger's vote is automatically recorded

### Review Process

1. Qualified users visit `/review` page
2. Choose between "Scam & Spam Patrol" or "Fact Checker" tabs
3. Review content and cast votes:
   - Spam/Scam: "Hide" or "Keep"
   - Outdated: "Mark as Outdated" or "Still Current"
4. Each vote earns +1 reputation

### Action Threshold

When 3 votes are collected:
- **Majority votes to hide/outdated**: Content is flagged, voters get +2 bonus
- **Majority votes to keep/current**: Flag is rejected, voters get +2 bonus
- Review queue item is marked as completed

### Content States

**Hidden Spam:**
- Can be filtered from display for regular users
- Visible to admins/moderators
- Shows warning banner when displayed

**Outdated:**
- Always visible with prominent warning
- Can be sorted lower in answer lists
- Helps tourists verify information

---

## 🔧 Configuration

### Adjust Reputation Thresholds

```sql
UPDATE review_thresholds 
SET min_reputation = 200, votes_needed = 5
WHERE review_type = 'spam_scam';
```

### Default Settings
- **Scam & Spam Patrol**: 100 reputation, 3 votes needed
- **Fact Checker**: 500 reputation, 3 votes needed

---

## 📋 Next Steps for Integration

### Required Updates to Existing Code

1. **Update Question/Answer Queries**
   - Add LEFT JOIN to `content_flags` table
   - Include `flag_type` and `is_active` fields
   - See [REVIEW_SYSTEM_INTEGRATION.md](REVIEW_SYSTEM_INTEGRATION.md) for examples

2. **Add Flag Buttons**
   - Questions detail page: Add to action bar
   - Answers: Add to each answer's action buttons
   - Comments: Add inline after timestamp

3. **Display Warnings**
   - Add ContentFlagWarning component at top of flagged content
   - Use compact mode for comments

4. **Optional: Filter Hidden Content**
   - Modify queries to exclude `hidden_spam` for regular users
   - Keep visible for admins with warning

### Example Files to Update

- `app/questions/[id]/page.tsx` - Main question detail page
- `app/api/questions/[id]/route.ts` - Question fetching API
- `app/api/answers/route.ts` - Answer fetching API
- `app/api/comments/route.ts` - Comment fetching API (if separate)

---

## 🎨 UI/UX Highlights

- **Clear reputation requirements** shown on flag menu
- **Real-time vote counts** displayed in review queue
- **Already voted** state prevents duplicate votes
- **Empty state** message when queue is clear
- **Pagination** for large review queues
- **Mobile responsive** design for all components
- **Color coding**: Red for spam, orange for outdated
- **Visual warnings** with icons and clear messaging

---

## 🔒 Security Features

- **Reputation gating**: Only qualified users can review
- **Unique vote constraint**: One vote per user per review item
- **Consensus-based**: Requires multiple votes before action
- **Audit trail**: All votes and actions are logged
- **Foreign key constraints**: Data integrity maintained

---

## 📈 Future Enhancements

Consider adding:
1. **Auto-detection**: Flag content with phone numbers automatically
2. **Appeal system**: Let authors contest flags
3. **Reviewer badges**: Reward active, accurate reviewers
4. **Review accuracy tracking**: Monitor individual reviewer performance
5. **Smart queueing**: Prioritize urgent/high-impact reviews
6. **Admin override**: Manual approve/reject capabilities
7. **Notifications**: Alert authors when content is flagged
8. **Analytics dashboard**: Review system health metrics

---

## 🆘 Support

For questions or issues:
1. Check [REVIEW_SYSTEM_GUIDE.md](REVIEW_SYSTEM_GUIDE.md) for detailed API documentation
2. See [REVIEW_SYSTEM_INTEGRATION.md](REVIEW_SYSTEM_INTEGRATION.md) for code examples
3. Review the database schema in [create-review-system.sql](database/create-review-system.sql)

---

## ✨ Benefits

- **Trust & Safety**: Community-powered scam detection
- **Content Quality**: Outdated information is clearly marked
- **Engagement**: Experienced users gain meaningful moderation role
- **Scalability**: Distributes moderation workload across community
- **Tourism Focus**: Addresses travel-specific needs (scams, price changes)

---

**The review system is production-ready!** Just run the database migration and start integrating the components into your existing pages.
