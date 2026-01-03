# Quality Ban System

## Overview

The quality ban system is a hidden, automated moderation mechanism that temporarily or permanently restricts users from posting questions based on the reception of their content. Unlike visible rate limiting, quality bans are applied silently based on accumulated "quality strikes" from downvotes, question closures, and deletions.

This system encourages users to improve their existing content rather than posting more low-quality questions.

## Features

- **Strike-based tracking**: Accumulates quality strikes based on negative feedback
- **Automatic ban escalation**: Progressive ban levels (warning → week → month → permanent)
- **Improvement detection**: Automatically lifts bans when users improve their questions
- **Silent operation**: Users receive ban notifications only when attempting to post
- **No manual appeals**: System automatically reassesses based on content improvements

## Database Schema

### Tables

#### `question_quality_metrics`
Tracks the current quality metrics for each question.

```sql
CREATE TABLE question_quality_metrics (
  id INT PRIMARY KEY AUTO_INCREMENT,
  question_id INT NOT NULL UNIQUE,
  downvotes INT DEFAULT 0,
  is_closed BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  INDEX idx_question_id (question_id)
) ENGINE=InnoDB;
```

#### `question_quality_strikes`
Records individual quality strikes with timestamps and types.

```sql
CREATE TABLE question_quality_strikes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  question_id INT NOT NULL,
  strike_type ENUM('downvote', 'closed', 'deleted') NOT NULL,
  strike_value DECIMAL(3,1) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  INDEX idx_user_strikes (user_id, created_at),
  INDEX idx_question_strikes (question_id)
) ENGINE=InnoDB;
```

#### `user_quality_bans`
Tracks active bans for users.

```sql
CREATE TABLE user_quality_bans (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  ban_level ENUM('warning', 'week', 'month', 'permanent') NOT NULL,
  total_strikes DECIMAL(5,1) NOT NULL,
  banned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL,
  is_active BOOLEAN DEFAULT TRUE,
  lifted_at TIMESTAMP NULL,
  lifted_reason TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_active_bans (user_id, is_active),
  INDEX idx_expiry (expires_at)
) ENGINE=InnoDB;
```

#### `quality_ban_config`
Configurable thresholds for ban levels.

```sql
CREATE TABLE quality_ban_config (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ban_level ENUM('warning', 'week', 'month', 'permanent') NOT NULL UNIQUE,
  strike_threshold DECIMAL(5,1) NOT NULL,
  duration_days INT NULL,
  description TEXT
) ENGINE=InnoDB;

-- Default configuration
INSERT INTO quality_ban_config (ban_level, strike_threshold, duration_days, description) VALUES
('warning', 3.0, NULL, 'First warning - user can still post but should improve content'),
('week', 5.0, 7, 'One week ban from posting questions'),
('month', 8.0, 30, 'One month ban from posting questions'),
('permanent', 12.0, NULL, 'Permanent ban from posting questions');
```

## Strike Values

Different negative actions accumulate different strike values:

| Action | Strike Value | Rationale |
|--------|-------------|-----------|
| Downvote | 0.5 | Single downvote may be subjective |
| Question Closed | 2.0 | Indicates clear quality issues |
| Question Deleted | 3.0 | Severe quality problems |

### Strike Accumulation Examples

- **5 downvotes** = 2.5 strikes (no ban)
- **3 closed questions** = 6 strikes → **Week ban**
- **2 deleted + 2 closed questions** = 10 strikes → **Month ban**
- **4 deleted questions** = 12 strikes → **Permanent ban**

## Ban Levels

### Warning (3.0 strikes)
- User can still post questions
- No explicit notification
- Serves as internal threshold for monitoring

### Week Ban (5.0 strikes)
- 7-day temporary ban from posting questions
- Error message: "You are temporarily banned from asking questions until [date] due to a pattern of poorly-received content..."
- Can be lifted by improving existing questions

### Month Ban (8.0 strikes)
- 30-day temporary ban from posting questions
- Similar error message with longer duration
- Can be lifted by improving existing questions

### Permanent Ban (12.0 strikes)
- Indefinite ban from posting questions
- Error message: "You are permanently banned from asking questions..."
- Can still be lifted by significant content improvements

## Ban Removal/Lifting

Bans are automatically lifted when users demonstrate improvement:

### Improvement Criteria
1. User edits one of their previously downvoted questions
2. The edited question receives upvotes (must reach score ≥ 2)
3. System recalculates total strikes
4. If strikes fall below current ban threshold, ban is lifted

### Example Recovery Path

**Scenario**: User has 6 strikes (week ban) from 3 closed questions (2 strikes each)

**Recovery**:
1. User edits all 3 closed questions with better content
2. Each question receives 3 upvotes (score goes positive)
3. Questions are no longer considered "poorly received"
4. Strikes recalculated: 0 strikes
5. Ban automatically lifted

## Integration Points

### 1. Question Posting (`/api/questions`)
```typescript
// Check if user is banned before allowing post
const banCheck = await checkQualityBan(userId);
if (banCheck.isBanned) {
  return NextResponse.json(
    { 
      error: banCheck.message,
      quality_ban: true,
      ban_level: banCheck.banLevel
    },
    { status: 403 }
  );
}
```

### 2. Voting System (`/api/votes`)
```typescript
// Record quality strike when question receives downvote
if (votableType === "question" && voteType === -1) {
  await recordQualityStrike(contentOwnerId, votableId, 'downvote');
}
```

### 3. Question Editing (`/api/questions/[id]/edit`)
```typescript
// Check if edit improves quality and potentially lifts ban
if (isAuthor) {
  await checkForQualityImprovement(currentUser.id, questionId);
}
```

### 4. Question Closure/Deletion
When implementing admin/moderator tools to close or delete questions:

```typescript
// Mark question as closed
await markQuestionClosed(questionId);

// For deletions, handle in the delete endpoint
await recordQualityStrike(questionOwnerId, questionId, 'deleted');
```

## Core Functions

### `checkQualityBan(userId: number)`
Checks if a user is currently banned from posting questions.

**Returns**:
```typescript
{
  isBanned: boolean;
  banLevel?: 'warning' | 'week' | 'month' | 'permanent';
  expiresAt?: Date;
  totalStrikes?: number;
  message?: string;
}
```

### `recordQualityStrike(userId: number, questionId: number, strikeType: 'downvote' | 'closed' | 'deleted')`
Records a quality strike and automatically applies bans if thresholds are exceeded.

**Process**:
1. Gets or creates quality metrics for the question
2. Updates metrics based on strike type
3. Records the strike in history
4. Calculates total strikes for user
5. Applies appropriate ban level if threshold exceeded

### `checkForQualityImprovement(userId: number, questionId: number)`
Called after a question is edited to check if improvements warrant lifting a ban.

**Process**:
1. Checks if question previously had negative reception
2. Verifies current score is positive (≥ 2)
3. Recalculates user's total quality strikes
4. Lifts ban if strikes now fall below ban threshold

### `markQuestionClosed(questionId: number)`
Marks a question as closed and records the strike for the author.

**Process**:
1. Gets question details including author
2. Updates quality metrics to mark as closed
3. Records 'closed' strike (value: 2.0)
4. Checks and applies ban if needed

## Monitoring & Analytics

### Checking User Strike Count
```sql
SELECT 
  user_id,
  SUM(strike_value) as total_strikes,
  COUNT(*) as total_strikes_count,
  COUNT(DISTINCT question_id) as affected_questions
FROM question_quality_strikes
WHERE user_id = ?
GROUP BY user_id;
```

### Finding Banned Users
```sql
SELECT 
  u.username,
  uqb.ban_level,
  uqb.total_strikes,
  uqb.banned_at,
  uqb.expires_at,
  TIMESTAMPDIFF(DAY, NOW(), uqb.expires_at) as days_remaining
FROM user_quality_bans uqb
JOIN users u ON uqb.user_id = u.id
WHERE uqb.is_active = TRUE
ORDER BY uqb.total_strikes DESC;
```

### Questions Contributing to Strikes
```sql
SELECT 
  q.id,
  q.title,
  qm.downvotes,
  qm.is_closed,
  qm.is_deleted,
  COUNT(qs.id) as strike_count,
  SUM(qs.strike_value) as total_strike_value
FROM questions q
LEFT JOIN question_quality_metrics qm ON q.id = qm.question_id
LEFT JOIN question_quality_strikes qs ON q.id = qs.question_id
WHERE q.user_id = ?
GROUP BY q.id
HAVING total_strike_value > 0
ORDER BY total_strike_value DESC;
```

## Configuration

Strike thresholds and ban durations can be adjusted via the `quality_ban_config` table:

```sql
-- Make permanent ban require more strikes
UPDATE quality_ban_config 
SET strike_threshold = 15.0 
WHERE ban_level = 'permanent';

-- Increase week ban duration
UPDATE quality_ban_config 
SET duration_days = 14 
WHERE ban_level = 'week';

-- Adjust downvote strike value (requires code change in quality-ban.ts)
-- This is hardcoded in the recordQualityStrike function
```

## User Experience

### For Banned Users

When attempting to post a question while banned:

**Temporary Ban**:
```
You are temporarily banned from asking questions until [date] due to a pattern of 
poorly-received content. You can lift this ban early by improving your existing 
questions. Edit them to be clearer, add more details, and fix any issues. Once 
they receive upvotes, your ban may be automatically lifted.
```

**Permanent Ban**:
```
You are permanently banned from asking questions due to consistently poorly-received 
content. You can work towards lifting this ban by significantly improving your 
existing questions. Edit them to add value, clarity, and detail. Once they receive 
positive feedback, your ban may be reconsidered.
```

### For Other Users
The system operates silently - other users don't see ban status or quality strikes. This prevents stigmatization while encouraging improvement.

## Privacy & Fairness

- **No public shaming**: Strike counts and ban status are not visible to other users
- **Automatic recalculation**: System continuously reassesses as content is improved
- **No manual intervention needed**: Users can self-rehabilitate through quality improvements
- **Transparent thresholds**: Ban levels are based on clear, objective metrics

## Best Practices

### For Implementation
1. Run database migrations in order (schema first, then default config)
2. Monitor strike accumulation in first few weeks to validate thresholds
3. Consider adding logging for ban events for analytics
4. Test improvement detection thoroughly

### For Tuning
1. Monitor false positive rate (good users getting banned)
2. Track rehabilitation rate (banned users who improve and return)
3. Adjust strike values if certain actions are too harsh/lenient
4. Consider reputation thresholds for strike weighting

### For Future Enhancements
- Email notifications when user is close to ban threshold
- Dashboard for users to see their quality metrics
- Moderator override capabilities for edge cases
- Appeal system for false positives
- Time decay for old strikes (forgive old mistakes)

## Troubleshooting

### User Can't Post Despite Improving Questions
1. Check if ban has expired naturally
2. Verify improved questions have score ≥ 2
3. Confirm `checkForQualityImprovement` was called after edit
4. Check `user_quality_bans` table for active ban status

### Strikes Not Recording
1. Verify vote is on a question (not answer)
2. Check that vote type is -1 (downvote)
3. Confirm `recordQualityStrike` is being called
4. Check `question_quality_strikes` table for entries

### Ban Not Lifting After Improvement
1. Verify question score is ≥ 2 (not just positive)
2. Check if user is the author (only authors get ban lifted)
3. Confirm total strikes fell below threshold
4. Check `user_quality_bans.lifted_at` timestamp

## API Error Responses

### Quality Ban Active
```json
{
  "error": "You are temporarily banned from asking questions...",
  "quality_ban": true,
  "ban_level": "week"
}
```
Status: 403 Forbidden

### Strike Recorded
No explicit response - strike recording happens in background during vote processing.

## Testing Scenarios

### Test 1: Accumulate Strikes
1. Create user account
2. Post 3 questions
3. Have each receive 2 downvotes (3 strikes total)
4. Verify warning threshold reached
5. Post another question with 4 downvotes (5 strikes total)
6. Verify week ban applied
7. Attempt to post new question - should be blocked

### Test 2: Lift Ban via Improvement
1. User has week ban (5 strikes)
2. Edit one downvoted question with better content
3. Question receives 3 upvotes (score = 1 → 4)
4. Verify strikes recalculated
5. Verify ban lifted
6. Attempt to post new question - should succeed

### Test 3: Permanent Ban Recovery
1. User has 12+ strikes (permanent ban)
2. Edit multiple questions over time
3. Each gets to score ≥ 2
4. Verify strikes decrease with each improvement
5. Once below 12, verify ban lifted

## Metrics to Track

- **Daily ban count by level**: Monitor ban application trends
- **Average time to ban lift**: How long users take to improve
- **Improvement rate**: % of banned users who successfully improve
- **False positive rate**: Bans on users who later prove valuable
- **Strike distribution**: Which strike types are most common
- **Rehabilitation rate**: Banned users who return to good standing

## Security Considerations

- Prevent gaming by requiring genuine upvotes (not just edits)
- Monitor for vote manipulation (coordinated upvoting to lift bans)
- Consider IP/browser fingerprinting for ban evasion detection
- Implement cooldown on improvement checks (prevent rapid edit spam)

## Conclusion

The quality ban system creates a self-regulating community where content quality is paramount. By focusing on improvement rather than punishment, it encourages users to learn from mistakes and contribute better content over time.

The system is designed to be fair, transparent, and automatic - requiring minimal moderator intervention while maintaining high content standards.
