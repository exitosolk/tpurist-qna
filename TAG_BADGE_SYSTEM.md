# Tag Badge System

## Overview

The Tag Badge System implements a hierarchical expertise recognition system for specific topics (tags). Users earn Bronze, Silver, and Gold badges in tags based on their contributions, with each tier unlocking special moderation privileges.

**Key Feature**: Gold badges have "freshness decay" - they become inactive if the user doesn't maintain activity in high-stakes tags like [visa], [exchange-rate], or [security].

## Badge Tiers & Requirements

### Bronze Badge: "The Explorer"

**Requirements:**
- Tag score > 5

**How to Earn:**
- Post answers in questions with this tag
- Receive upvotes on those answers (each upvote = 10 points)

**Privileges:**
- Bragging rights on profile
- Visual badge display next to username in tag-specific contexts

**Example Path:**
- Answer 1 question with this tag → Get 1 upvote → **Bronze badge earned**

---

### Silver Badge: "The Guide"

**Requirements:**
- Tag score > 25
- At least 3 accepted answers in this tag

**How to Earn:**
- Consistently provide quality answers
- Get answers accepted by question owners
- Accumulate upvotes

**Privileges:**
- **Retagging Rights**: Can retag any question that includes this tag without approval
- All Bronze privileges

**Example Path:**
- Answer 5 questions → Get 3 accepted + 2 upvoted (3 upvotes total) → **Silver badge earned**

---

### Gold Badge: "The Resident Expert"

**Requirements:**
- Tag score > 75
- At least 10 accepted answers in this tag
- **Freshness requirement**: Must earn 5+ points in this tag every 6 months

**How to Earn:**
- Demonstrate domain mastery over time
- Consistently solve problems (high accepted answer count)
- Maintain expertise through continued activity

**Privileges:**
- **The Hammer**: Can single-handedly close questions as duplicate/spam/off-topic without waiting for community votes
- All Silver privileges (retagging)
- All Bronze privileges (display)

**Freshness Decay:**
- If you don't earn 5+ points in 6 months, badge turns **grey (inactive)**
- Inactive badges lose all privileges
- Visual indicator shows "This user was an expert, but might not know current situation"
- Can reactivate by earning 5+ points again

**Example Path:**
- Answer 15 questions → Get 10 accepted + 5 upvoted (8 additional upvotes) → **Gold badge earned**
- Maintain activity: Post/upvote at least once every 6 months

## Point System

### How Points Are Earned

| Action | Points | Notes |
|--------|--------|-------|
| Answer upvote | +10 | Each upvote on your answer adds 10 points |
| Accepted answer | 0* | Increments accepted answer count, but doesn't add score points |
| Answer downvote | 0 | Does not reduce tag score |

*Accepted answers are tracked separately because they're a quality metric, not a score metric.

### Score Calculation

**Tag Score** = Sum of all upvotes on answers in that tag × 10

**Example:**
- 5 answers in [transport] tag
- Answers receive: 2, 1, 0, 3, 1 upvotes
- Tag score = (2+1+0+3+1) × 10 = **70 points**
- Accepted answers: 3 of those 5 answers accepted = **3 accepted**
- Result: Close to Silver badge (need 25+ score and 3 accepted ✓)

## Superpowers Explained

### Silver: Retagging Rights

**What it does:**
- Edit tags on any question that currently has your badge tag
- No approval/review needed
- Instant application

**Use case:**
```
❌ Before: Question about "surfing in Arugam Bay" tagged [colombo]
✅ After: Silver [surfing] badge holder retags to [arugam-bay] [surfing]
```

**How to use:**
```
PUT /api/questions/{id}/retag
{
  "tags": ["arugam-bay", "surfing"],
  "reason": "Fixed incorrect location tag"
}
```

**Restrictions:**
- Must have Silver or Gold badge in at least one of the *new* tags
- Creates revision history entry
- Can be used on any question, not just your own

---

### Gold: The Hammer

**What it does:**
- Close questions as duplicate/spam/off-topic with a **single vote**
- Bypasses the usual 5-vote requirement
- Instant closure - no queue, no waiting

**Use case:**
```
Scenario: 10th question this week asking "How to get Sri Lanka visa?"
Action: Gold [visa] badge holder → Hammer → Closed as duplicate in one click
Result: Instant redirect to canonical visa question
```

**Close Types:**
1. **Duplicate**: Mark as duplicate of another question
2. **Spam**: Offensive or promotional content
3. **Off-topic**: Not relevant to the community

**How to use:**
```
POST /api/questions/{id}/hammer
{
  "action": "duplicate",
  "duplicateOf": 12345,
  "reason": "Exact duplicate of canonical visa question"
}
```

**Restrictions:**
- Must have **active** Gold badge in one of the question's tags
- Badge must not be grey (inactive)
- Cannot reopen questions (only close)
- Action is logged in moderation_log

**Why it's powerful:**
This offloads moderation from site admins to domain experts. The people who know [transport] best can police [transport] questions themselves.

## Freshness Decay System

### Why It Exists

In a tourism/travel Q&A:
- **Code logic** (Stack Overflow): Doesn't change often. A Java expert from 2015 is still relevant.
- **Travel info** (OneCeylon): Changes constantly. Exchange rates, visa rules, bus schedules, security situations all evolve.

A Gold [visa] badge holder from 2023 might give outdated advice in 2026 if they haven't been active.

### How It Works

1. **Tracking Window**: Last 6 months
2. **Threshold**: Must earn 5+ points in tag within window
3. **Check Frequency**: Daily cron job at 2 AM
4. **Consequence**: Badge marked inactive (grey)

### Calculation

```
Points in last 6 months = SUM(upvotes × 10) since last freshness check
```

If points < 5:
- Badge → Inactive
- Visual: Grey color
- Privileges: Lost (no hammer, no retag)
- Profile: Shows "Former expert in [tag]"

### Reactivation

**Automatic** - no manual appeal needed:
- Earn 5+ points again
- Next daily check reactivates badge
- Regain all privileges

**Example Timeline:**
- Jan 2025: Earn Gold [visa] badge
- Jan-Jul 2025: Active in [visa] questions
- Jul 2025-Jan 2026: No activity
- Jan 2026: Badge marked inactive
- Feb 2026: Post 1 answer → Gets 1 upvote (10 points)
- Feb 2026: Badge reactivated ✓

### Tags Subject to Decay

**High-stakes tags** (recommended):
- [visa]
- [exchange-rate]
- [security]
- [covid-19]
- [emergency]
- [border-crossing]

**Stable tags** (no decay needed):
- [history]
- [culture]
- [photography]
- [temples]

Configure in database:
```sql
UPDATE tag_badge_config 
SET requires_freshness = TRUE
WHERE badge_tier = 'gold';
```

Currently applies to ALL Gold badges, but can be customized per tag.

## Database Schema

### Core Tables

#### `user_tag_scores`
Tracks user's cumulative score and accepted answer count per tag.

```sql
user_id | tag_id | total_score | accepted_answers_count | last_activity_at
--------|--------|-------------|------------------------|------------------
123     | 5      | 85          | 12                     | 2026-01-03
```

#### `user_tag_badges`
Tracks earned badges with active/inactive status.

```sql
user_id | tag_id | badge_tier | is_active | freshness_score_since_check | last_freshness_check
--------|--------|------------|-----------|----------------------------|---------------------
123     | 5      | gold       | TRUE      | 15                         | 2025-12-01
```

#### `tag_badge_activity`
Logs all point-earning activities for freshness tracking.

```sql
user_id | tag_id | activity_type   | points_earned | created_at
--------|--------|-----------------|---------------|------------
123     | 5      | upvote          | 10            | 2025-12-15
123     | 5      | accepted_answer | 0             | 2025-12-20
```

#### `tag_badge_config`
Configurable thresholds per tier.

```sql
badge_tier | min_score | min_accepted_answers | freshness_points_required | freshness_period_months
-----------|-----------|----------------------|--------------------------|------------------------
bronze     | 5         | 0                    | 0                        | 0
silver     | 25        | 3                    | 0                        | 0
gold       | 75        | 10                   | 5                        | 6
```

## API Endpoints

### Check User's Badge in Tag
```
GET /api/users/{userId}/tag-badges?tagId={tagId}

Response:
{
  "hasBadge": true,
  "tier": "gold",
  "isActive": true,
  "canRetag": true,
  "canHammer": true
}
```

### Get User's All Tag Badges
```
GET /api/users/{userId}/tag-badges

Response:
{
  "badges": [
    {
      "tagName": "visa",
      "tier": "gold",
      "isActive": true,
      "score": 95,
      "acceptedAnswers": 13,
      "earnedAt": "2025-01-15"
    }
  ]
}
```

### Retag Question (Silver+)
```
PUT /api/questions/{id}/retag
{
  "tags": ["new-tag-1", "new-tag-2"],
  "reason": "Fixed incorrect categorization"
}
```

### Use Hammer (Gold only)
```
POST /api/questions/{id}/hammer
{
  "action": "duplicate",
  "duplicateOf": 456,
  "reason": "Exact duplicate of canonical answer"
}
```

### Cron: Check Freshness
```
GET /api/cron/check-badge-freshness
Authorization: Bearer {CRON_SECRET}

Runs daily at 2 AM (configured in vercel.json)
```

## UI Components

### Display Badge Next to Username

```tsx
import TagBadge from '@/components/TagBadge';

<TagBadge 
  tier="gold" 
  tagName="visa" 
  isActive={true} 
  size="md" 
/>
```

### Show User's Badge Collection

```tsx
import { TagBadgeList } from '@/components/TagBadge';

<TagBadgeList 
  badges={userBadges}
  maxDisplay={5}
  size="sm"
/>
```

### Badge Detail Card

```tsx
import { TagBadgeCard } from '@/components/TagBadge';

<TagBadgeCard
  tier="gold"
  tagName="transport"
  isActive={true}
  score={125}
  acceptedAnswers={18}
  earnedAt={new Date('2025-06-01')}
  lastActivity={new Date('2025-12-28')}
/>
```

## Integration Flow

### When User Posts Answer

1. Answer posted with tags: `[transport]`, `[colombo]`
2. Answer receives upvote
3. System:
   - Updates `user_tag_scores` for both tags (+10 points each)
   - Records activity in `tag_badge_activity`
   - Checks badge thresholds
   - Awards Bronze if score > 5
   - Updates `freshness_score_since_check` for any Gold badges

### When Answer Is Accepted

1. Question owner accepts answer
2. System:
   - Increments `accepted_answers_count` in `user_tag_scores`
   - Records activity in `tag_badge_activity` (0 points, but logged)
   - Checks badge thresholds
   - Awards Silver if score > 25 AND accepted >= 3

### Daily Freshness Check

1. Cron job runs at 2 AM
2. System:
   - Finds all Gold badges with `last_freshness_check` > 6 months ago
   - Calculates points earned since last check
   - If points < 5: Mark badge inactive
   - If points >= 5: Reset freshness counter

## Example Scenarios

### Scenario 1: Journey to Gold Badge

**User: Sarah**
**Tag: [surfing]**

| Date | Action | Score | Accepted | Badge |
|------|--------|-------|----------|-------|
| Jan 1 | Post answer about Arugam Bay | 0 | 0 | None |
| Jan 2 | Answer gets 1 upvote | 10 | 0 | 🥉 Bronze |
| Jan 5 | Post 2 more answers, 1 accepted | 10 | 1 | 🥉 Bronze |
| Jan 10 | Previous answers get 2 upvotes | 30 | 1 | 🥉 Bronze |
| Feb 1 | Post 3 answers, 2 accepted | 30 | 3 | 🥈 Silver (can retag) |
| Feb 15 | Answers accumulate 5 more upvotes | 80 | 3 | 🥈 Silver |
| Mar 1 | Post 8 answers, 7 accepted, 2 upvotes | 100 | 10 | 🥇 Gold (has hammer) |

Sarah can now:
- Close duplicate surfing questions instantly
- Retag surfing questions
- Display gold badge on profile

### Scenario 2: Badge Goes Inactive

**User: John**
**Tag: [visa]**

| Date | Event | Badge Status |
|------|-------|--------------|
| Jun 2025 | Earns Gold [visa] badge | 🥇 Active |
| Jun-Dec 2025 | Posts 5 answers, 10 upvotes | 🥇 Active |
| Dec 2025 | Last freshness check | 🥇 Active |
| Jan-Jun 2026 | No activity in [visa] | 🥇 Active (but counting down) |
| Jun 2026 | Freshness check: 0 points in 6 months | ⚫ Inactive |
| Jun 2026 | Tries to use hammer | ❌ Permission denied |
| Jul 2026 | Posts 1 answer, gets 1 upvote (10 pts) | 🥇 Reactivated! |

### Scenario 3: Silver Retagging

**User: Maria (Silver [temples] badge)**

1. Sees question: "What time does Sigiriya open?"
2. Question incorrectly tagged: `[colombo]` `[history]`
3. Maria uses Silver privilege:
   - Clicks "Retag" button
   - Changes to: `[sigiriya]` `[temples]` `[unesco-sites]`
   - Adds reason: "Sigiriya is a temple site, not a Colombo attraction"
4. Tags updated instantly, no review needed
5. Revision history logs the change

### Scenario 4: Gold Hammer

**User: David (Gold [transport] badge)**

1. New question posted: "How much is bus from Colombo to Kandy?"
2. David recognizes it's the 15th time this month
3. Uses hammer:
   - Clicks "Close" → "Duplicate"
   - Selects canonical question (#1234)
   - Adds note: "Please see the comprehensive bus pricing guide"
4. Question closed **immediately** (no waiting for 4 other votes)
5. Asker sees:
   > This question has been marked as a duplicate by David, a Gold badge holder in [transport].
   > See the original question here: [Colombo-Kandy bus pricing guide]

## Configuration & Tuning

### Adjusting Badge Thresholds

Too easy to get Gold badges?

```sql
UPDATE tag_badge_config 
SET min_score = 150,
    min_accepted_answers = 20
WHERE badge_tier = 'gold';
```

### Changing Freshness Requirements

Make it stricter:

```sql
UPDATE tag_badge_config 
SET freshness_points_required = 10,
    freshness_period_months = 3
WHERE badge_tier = 'gold';
```

### Disable Freshness Decay

```sql
UPDATE tag_badge_config 
SET requires_freshness = FALSE
WHERE badge_tier = 'gold';
```

### Per-Tag Freshness Settings

Future enhancement - add `tag_id` column to config table to have different rules per tag.

## Monitoring & Analytics

### Top Badge Holders by Tag

```sql
SELECT 
  u.username,
  t.name as tag_name,
  utb.badge_tier,
  uts.total_score,
  uts.accepted_answers_count,
  utb.is_active
FROM user_tag_badges utb
JOIN users u ON utb.user_id = u.id
JOIN tags t ON utb.tag_id = t.id
JOIN user_tag_scores uts ON utb.user_id = uts.user_id AND utb.tag_id = uts.tag_id
WHERE t.name = 'visa'
ORDER BY 
  CASE utb.badge_tier WHEN 'gold' THEN 3 WHEN 'silver' THEN 2 WHEN 'bronze' THEN 1 END DESC,
  uts.total_score DESC
LIMIT 10;
```

### Inactive Gold Badges

```sql
SELECT 
  u.username,
  t.name as tag_name,
  utb.marked_inactive_at,
  DATEDIFF(NOW(), utb.marked_inactive_at) as days_inactive
FROM user_tag_badges utb
JOIN users u ON utb.user_id = u.id
JOIN tags t ON utb.tag_id = t.id
WHERE utb.badge_tier = 'gold' 
  AND utb.is_active = FALSE
ORDER BY utb.marked_inactive_at DESC;
```

### Badge Distribution

```sql
SELECT 
  badge_tier,
  COUNT(*) as total_badges,
  SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as active_badges,
  SUM(CASE WHEN NOT is_active THEN 1 ELSE 0 END) as inactive_badges
FROM user_tag_badges
GROUP BY badge_tier;
```

## Setup Instructions

### 1. Run Database Migrations

```bash
# Core tag badge system
mysql < database/create-tag-badge-system.sql

# Hammer feature support tables
mysql < database/create-hammer-support-tables.sql
```

### 2. Configure Environment Variables

```bash
# .env.local
CRON_SECRET=your-secret-key-here
```

### 3. Set Up Cron Job

**Option A: Vercel Cron (if on Vercel)**
```json
// vercel.json already configured
{
  "crons": [{
    "path": "/api/cron/check-badge-freshness",
    "schedule": "0 2 * * *"
  }]
}
```

**Option B: External Cron (if self-hosted)**
```bash
# Add to crontab
0 2 * * * curl -X POST https://yoursite.com/api/cron/check-badge-freshness \
  -H "Authorization: Bearer $CRON_SECRET"
```

**Option C: GitHub Actions**
```yaml
# .github/workflows/check-badge-freshness.yml
name: Check Badge Freshness
on:
  schedule:
    - cron: '0 2 * * *'
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - name: Call cron endpoint
        run: |
          curl -X POST ${{ secrets.SITE_URL }}/api/cron/check-badge-freshness \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

### 4. Import UI Components

```tsx
// In any component that displays user info
import TagBadge, { TagBadgeList, TagBadgeCard } from '@/components/TagBadge';
```

### 5. Test the System

```bash
# 1. Post an answer
# 2. Upvote it
# 3. Check database
SELECT * FROM user_tag_scores WHERE user_id = YOUR_ID;

# 4. Manually test hammer
curl -X POST http://localhost:3000/api/questions/1/hammer \
  -H "Content-Type: application/json" \
  -d '{"action": "spam", "reason": "Test"}'
```

## Best Practices

### For Site Administrators

1. **Monitor badge distribution**: Ensure badges aren't too easy/hard to earn
2. **Review hammer usage**: Check `moderation_log` for abuse
3. **Adjust thresholds seasonally**: Tourist seasons may require different activity levels
4. **Communicate changes**: Notify users if thresholds change

### For Users

1. **Focus on quality**: Accepted answers matter more than volume
2. **Stay current**: In time-sensitive tags, post regularly to maintain Gold badges
3. **Use hammer wisely**: Only close obvious duplicates/spam
4. **Retag thoughtfully**: Add value, don't just shuffle tags

### For Developers

1. **Cache badge checks**: Don't query on every page load
2. **Index properly**: Tag score queries can be expensive
3. **Monitor cron execution**: Ensure freshness checks run daily
4. **Log hammer actions**: Track for potential abuse

## Troubleshooting

### Badge Not Awarded Despite Meeting Requirements

**Check:**
```sql
SELECT * FROM user_tag_scores WHERE user_id = ? AND tag_id = ?;
```

Verify `total_score` and `accepted_answers_count` meet thresholds.

**Common issue**: Upvotes on questions don't count, only upvotes on *answers*.

### Hammer Permission Denied

**Check:**
```sql
SELECT * FROM user_tag_badges 
WHERE user_id = ? AND tag_id = ? AND badge_tier = 'gold' AND is_active = TRUE;
```

**Common issues:**
- Badge is inactive (grey)
- User has badge in different tag than question's tags
- Badge was just earned, may need page refresh

### Freshness Not Updating

**Check:**
```sql
SELECT * FROM tag_badge_activity 
WHERE user_id = ? AND tag_id = ? 
ORDER BY created_at DESC;
```

**Common issues:**
- Cron job not running
- Activity recorded but badge check hasn't run yet
- Points earned on questions, not answers

### Retag Not Working

**Check:**
```sql
SELECT * FROM user_tag_badges 
WHERE user_id = ? 
  AND badge_tier IN ('silver', 'gold') 
  AND is_active = TRUE;
```

Verify user has Silver/Gold badge in at least one of the *new* tags, not the old ones.

## Future Enhancements

### Planned Features

1. **Tag-specific freshness rules**
   - [visa], [covid-19]: 3 months
   - [history], [culture]: No decay
   - [exchange-rate]: 1 month

2. **Badge progress indicators**
   - Show users "50% to Silver badge in [transport]"
   - Encourage continued contribution

3. **Leaderboards**
   - Top badge holders per tag
   - Most active experts this month

4. **Badge notifications**
   - Email when badge earned
   - Warning when Gold badge at risk (4 months no activity)

5. **Appeal system**
   - Users can request manual review of hammer closures
   - Moderators can override if needed

6. **Badge showcase**
   - Dedicated profile page for all badges
   - Share badge achievements on social media

## Conclusion

The Tag Badge System creates a self-moderating community where domain experts naturally rise to handle moderation in their areas of expertise. The freshness decay ensures advice stays current in fast-changing topics while stable topics don't require constant activity.

**Key Success Metrics:**
- % of duplicates closed by hammer vs. community vote
- Average time to badge reactivation after going inactive
- Retag quality score (how often retags are re-reverted)
- Expert retention rate (Gold badge holders still active after 1 year)

For questions or suggestions, see the development team or file an issue in the repository.
