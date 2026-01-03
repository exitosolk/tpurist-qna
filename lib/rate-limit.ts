import { query } from './db';

export type RateLimitAction = 'question' | 'answer' | 'comment' | 'vote' | 'edit' | 'flag';

interface RateLimitConfig {
  actionType: RateLimitAction;
  minReputation: number;
  maxReputation: number | null;
  maxActions: number;
  timeWindowMinutes: number;
  description: string;
}

interface RateLimitResult {
  allowed: boolean;
  limit?: number;
  remaining?: number;
  resetAt?: Date;
  message?: string;
}

/**
 * Check if a user can perform a specific action based on rate limits
 * @param userId - The ID of the user attempting the action
 * @param actionType - The type of action being performed
 * @returns RateLimitResult indicating if action is allowed and relevant details
 */
export async function checkRateLimit(
  userId: number,
  actionType: RateLimitAction
): Promise<RateLimitResult> {
  try {
    // Get user's reputation
    const userResult = await query(
      'SELECT reputation FROM users WHERE id = ?',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return {
        allowed: false,
        message: 'User not found',
      };
    }

    const reputation = userResult.rows[0].reputation;

    // Get applicable rate limit configs for this user's reputation level
    const configResult = await query(
      `SELECT * FROM rate_limit_config 
       WHERE action_type = ? 
       AND min_reputation <= ? 
       AND (max_reputation IS NULL OR max_reputation >= ?)
       ORDER BY time_window_minutes ASC`,
      [actionType, reputation, reputation]
    );

    if (configResult.rows.length === 0) {
      // No rate limit configured, allow action
      return { allowed: true };
    }

    // Check each rate limit window (e.g., 15 min and 24 hour limits)
    for (const config of configResult.rows) {
      const timeWindowMinutes = config.time_window_minutes;
      const maxActions = config.max_actions;

      // Count actions in the time window
      const countResult = await query(
        `SELECT COUNT(*) as count 
         FROM rate_limit_actions 
         WHERE user_id = ? 
         AND action_type = ? 
         AND created_at > DATE_SUB(NOW(), INTERVAL ? MINUTE)`,
        [userId, actionType, timeWindowMinutes]
      );

      const actionCount = countResult.rows[0].count;

      if (actionCount >= maxActions) {
        // Get the oldest action in the window to calculate reset time
        const oldestResult = await query(
          `SELECT created_at 
           FROM rate_limit_actions 
           WHERE user_id = ? 
           AND action_type = ? 
           AND created_at > DATE_SUB(NOW(), INTERVAL ? MINUTE)
           ORDER BY created_at ASC 
           LIMIT 1`,
          [userId, actionType, timeWindowMinutes]
        );

        const resetAt = oldestResult.rows.length > 0
          ? new Date(
              new Date(oldestResult.rows[0].created_at).getTime() +
              timeWindowMinutes * 60 * 1000
            )
          : new Date(Date.now() + timeWindowMinutes * 60 * 1000);

        return {
          allowed: false,
          limit: maxActions,
          remaining: 0,
          resetAt,
          message: getRateLimitMessage(actionType, maxActions, timeWindowMinutes, resetAt),
        };
      }
    }

    // All limits passed, calculate remaining from the most restrictive active limit
    const mostRestrictiveConfig = configResult.rows[0] as RateLimitConfig;
    const countResult = await query(
      `SELECT COUNT(*) as count 
       FROM rate_limit_actions 
       WHERE user_id = ? 
       AND action_type = ? 
       AND created_at > DATE_SUB(NOW(), INTERVAL ? MINUTE)`,
      [userId, actionType, mostRestrictiveConfig.timeWindowMinutes]
    );

    const actionCount = countResult.rows[0].count;
    const remaining = mostRestrictiveConfig.maxActions - actionCount;

    return {
      allowed: true,
      limit: mostRestrictiveConfig.maxActions,
      remaining: remaining > 0 ? remaining : 0,
    };
  } catch (error) {
    console.error('Rate limit check error:', error);
    // On error, allow the action but log the error
    return { allowed: true };
  }
}

/**
 * Record an action for rate limiting purposes
 * @param userId - The ID of the user performing the action
 * @param actionType - The type of action being performed
 */
export async function recordRateLimitAction(
  userId: number,
  actionType: RateLimitAction
): Promise<void> {
  try {
    await query(
      'INSERT INTO rate_limit_actions (user_id, action_type) VALUES (?, ?)',
      [userId, actionType]
    );

    // Clean up old records (older than 30 days) to prevent table bloat
    await query(
      `DELETE FROM rate_limit_actions 
       WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)`,
      []
    );
  } catch (error) {
    console.error('Failed to record rate limit action:', error);
    // Don't throw - recording failure shouldn't block the action
  }
}

/**
 * Get a user-friendly rate limit error message
 */
function getRateLimitMessage(
  actionType: RateLimitAction,
  limit: number,
  timeWindowMinutes: number,
  resetAt: Date
): string {
  const actionLabel = getActionLabel(actionType);
  const timeLabel = getTimeWindowLabel(timeWindowMinutes);
  const resetTime = formatResetTime(resetAt);

  return `You've reached your limit of ${limit} ${actionLabel} per ${timeLabel}. Please try again ${resetTime}.`;
}

/**
 * Get a user-friendly action label
 */
function getActionLabel(actionType: RateLimitAction): string {
  const labels: Record<RateLimitAction, string> = {
    question: 'questions',
    answer: 'answers',
    comment: 'comments',
    vote: 'votes',
    edit: 'edits',
    flag: 'flags',
  };
  return labels[actionType] || actionType;
}

/**
 * Get a user-friendly time window label
 */
function getTimeWindowLabel(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? 's' : ''}`;
}

/**
 * Format reset time in a user-friendly way
 */
function formatResetTime(resetAt: Date): string {
  const now = Date.now();
  const resetTime = resetAt.getTime();
  const diffMs = resetTime - now;

  if (diffMs < 0) {
    return 'now';
  }

  const diffMinutes = Math.ceil(diffMs / (1000 * 60));
  
  if (diffMinutes < 60) {
    return `in ${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`;
  }

  const diffHours = Math.ceil(diffMinutes / 60);
  if (diffHours < 24) {
    return `in ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
  }

  const diffDays = Math.ceil(diffHours / 24);
  return `in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
}

/**
 * Get current rate limit status for a user and action
 * Useful for displaying remaining actions in UI
 */
export async function getRateLimitStatus(
  userId: number,
  actionType: RateLimitAction
): Promise<{
  limit: number;
  remaining: number;
  resetAt: Date;
} | null> {
  try {
    const userResult = await query(
      'SELECT reputation FROM users WHERE id = ?',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return null;
    }

    const reputation = userResult.rows[0].reputation;

    // Get the primary (longest) rate limit config
    const configResult = await query(
      `SELECT * FROM rate_limit_config 
       WHERE action_type = ? 
       AND min_reputation <= ? 
       AND (max_reputation IS NULL OR max_reputation >= ?)
       ORDER BY time_window_minutes DESC
       LIMIT 1`,
      [actionType, reputation, reputation]
    );

    if (configResult.rows.length === 0) {
      return null;
    }

    const config = configResult.rows[0];
    const timeWindowMinutes = config.time_window_minutes;
    const maxActions = config.max_actions;

    const countResult = await query(
      `SELECT COUNT(*) as count, MIN(created_at) as oldest
       FROM rate_limit_actions 
       WHERE user_id = ? 
       AND action_type = ? 
       AND created_at > DATE_SUB(NOW(), INTERVAL ? MINUTE)`,
      [userId, actionType, timeWindowMinutes]
    );

    const actionCount = countResult.rows[0].count;
    const remaining = Math.max(0, maxActions - actionCount);
    
    const resetAt = countResult.rows[0].oldest
      ? new Date(
          new Date(countResult.rows[0].oldest).getTime() +
          timeWindowMinutes * 60 * 1000
        )
      : new Date(Date.now() + timeWindowMinutes * 60 * 1000);

    return {
      limit: maxActions,
      remaining,
      resetAt,
    };
  } catch (error) {
    console.error('Failed to get rate limit status:', error);
    return null;
  }
}
