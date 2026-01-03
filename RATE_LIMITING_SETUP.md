# Rate Limiting System

## Overview
This system prevents spam and abuse by limiting the number of actions users can perform within specific time windows. Rate limits are reputation-based, with higher reputation users receiving more generous limits.

## Database Schema

### Tables Created
- **`rate_limit_actions`**: Tracks all user actions with timestamps
- **`rate_limit_config`**: Stores configurable rate limit rules

### Setup Instructions
1. Run the SQL migration:
   ```bash
   mysql -u your_user -p your_database < database/create-rate-limits-table.sql
   ```

## Rate Limit Configuration

### Default Limits by Action Type

#### Questions
| Reputation Range | Daily Limit | Short-term Limit |
|-----------------|-------------|------------------|
| 0-49 | 3 per day | 1 per 15 min |
| 50-499 | 10 per day | - |
| 500+ | 20 per day | - |

#### Answers
| Reputation Range | Daily Limit | Short-term Limit |
|-----------------|-------------|------------------|
| 0-49 | 10 per day | 3 per 15 min |
| 50-499 | 30 per day | - |
| 500+ | 50 per day | - |

#### Comments
| Reputation Range | Daily Limit | Short-term Limit |
|-----------------|-------------|------------------|
| 0-49 | 20 per day | 5 per 15 min |
| 50-499 | 50 per day | - |
| 500+ | 100 per day | - |

#### Votes
| Reputation Range | Daily Limit |
|-----------------|-------------|
| 0-49 | 30 per day |
| 50-499 | 60 per day |
| 500+ | 100 per day |

#### Edits
| Reputation Range | Daily Limit |
|-----------------|-------------|
| 0-49 | 5 per day |
| 50-499 | 20 per day |
| 500+ | 50 per day |

#### Flags
| Reputation Range | Daily Limit |
|-----------------|-------------|
| 0-49 | 5 per day |
| 50-499 | 15 per day |
| 500+ | 30 per day |

## Implementation Details

### Rate Limit Utility Functions

The [lib/rate-limit.ts](lib/rate-limit.ts) module provides three main functions:

1. **`checkRateLimit(userId, actionType)`**
   - Checks if a user can perform an action
   - Returns allowed status, remaining count, and reset time
   - Returns user-friendly error messages

2. **`recordRateLimitAction(userId, actionType)`**
   - Records an action after it's successfully performed
   - Automatically cleans up old records (30+ days)

3. **`getRateLimitStatus(userId, actionType)`**
   - Gets current rate limit status for UI display
   - Returns limit, remaining, and reset time

### Integration Example

```typescript
import { checkRateLimit, recordRateLimitAction } from '@/lib/rate-limit';

// Before performing action
const rateLimitCheck = await checkRateLimit(userId, 'question');
if (!rateLimitCheck.allowed) {
  return NextResponse.json(
    { 
      error: rateLimitCheck.message,
      rate_limit_exceeded: true,
      limit: rateLimitCheck.limit,
      resetAt: rateLimitCheck.resetAt
    },
    { status: 429 }
  );
}

// After successful action
await recordRateLimitAction(userId, 'question');
```

### Endpoints Updated

Rate limiting has been integrated into the following endpoints:

1. **Questions**
   - [app/api/questions/route.ts](app/api/questions/route.ts) - POST endpoint
   
2. **Answers**
   - [app/api/questions/[id]/answers/route.ts](app/api/questions/[id]/answers/route.ts) - POST endpoint
   
3. **Comments**
   - [app/api/answers/[id]/comments/route.ts](app/api/answers/[id]/comments/route.ts) - POST endpoint
   
4. **Votes**
   - [app/api/votes/route.ts](app/api/votes/route.ts) - POST endpoint

## Error Responses

When a rate limit is exceeded, the API returns a 429 status code with:

```json
{
  "error": "You've reached your limit of 3 questions per day. Please try again in 4 hours.",
  "rate_limit_exceeded": true,
  "limit": 3,
  "resetAt": "2026-01-04T12:00:00Z"
}
```

## Customization

### Adjusting Limits

To modify rate limits, update the `rate_limit_config` table:

```sql
UPDATE rate_limit_config 
SET max_actions = 5 
WHERE action_type = 'question' 
  AND min_reputation = 0 
  AND max_reputation = 49;
```

### Adding New Action Types

1. Add the action type to the ENUM in both tables:
   ```sql
   ALTER TABLE rate_limit_actions 
   MODIFY action_type ENUM('question', 'answer', 'comment', 'vote', 'edit', 'flag', 'your_new_action');
   ```

2. Insert configuration for the new action type:
   ```sql
   INSERT INTO rate_limit_config (action_type, min_reputation, max_reputation, max_actions, time_window_minutes, description)
   VALUES ('your_new_action', 0, 49, 10, 1440, 'Description here');
   ```

3. Update the TypeScript type in [lib/rate-limit.ts](lib/rate-limit.ts):
   ```typescript
   export type RateLimitAction = 'question' | 'answer' | 'comment' | 'vote' | 'edit' | 'flag' | 'your_new_action';
   ```

## UI Integration (Future Enhancement)

Consider adding these UI features:

1. **Rate Limit Warning**
   - Display remaining actions near post buttons
   - Example: "3 questions remaining today"

2. **Progress Indicator**
   - Show visual progress bar for daily limits
   - Highlight when approaching limit

3. **Reset Timer**
   - Display countdown to reset time
   - Example: "Resets in 4 hours"

4. **Reputation Incentive**
   - Show next reputation threshold and benefits
   - Example: "Earn 50 more reputation to unlock 10 questions/day"

## Maintenance

### Automatic Cleanup
The system automatically deletes records older than 30 days when new actions are recorded to prevent database bloat.

### Manual Cleanup
To manually clean up old records:

```sql
DELETE FROM rate_limit_actions 
WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);
```

### Monitoring

Query to see most active users by action type:

```sql
SELECT 
  u.username,
  rla.action_type,
  COUNT(*) as action_count
FROM rate_limit_actions rla
JOIN users u ON rla.user_id = u.id
WHERE rla.created_at > DATE_SUB(NOW(), INTERVAL 1 DAY)
GROUP BY u.username, rla.action_type
ORDER BY action_count DESC
LIMIT 20;
```

## Testing

To test rate limiting:

1. Create a test user account
2. Perform actions rapidly (e.g., post multiple questions)
3. Verify that after hitting the limit, you receive a 429 error
4. Check that the error message shows the correct reset time

## Security Considerations

- Rate limits are enforced server-side and cannot be bypassed by client manipulation
- User reputation is checked on each request to ensure accurate limits
- Failed rate limit checks are logged for monitoring abuse patterns
- The system gracefully handles errors (allows action if rate limit check fails)

## Future Enhancements

1. **IP-based rate limiting** - For anonymous users or additional security
2. **Custom limits per user** - Override limits for specific trusted users
3. **Temporary limit increases** - During special events or contests
4. **Rate limit analytics dashboard** - Admin interface to view and adjust limits
5. **Progressive rate limiting** - Stricter limits for repeatedly flagged users
