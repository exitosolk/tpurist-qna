// Badge awarding utility functions
import { PoolConnection } from 'mysql2/promise';
import pool from './db';

export type BadgeName = 
  // Bronze Tier
  'Ayubowan' | 'First Landing' | 'Rice & Curry' | 'Snapshot' |
  // Silver Tier
  'Price Police' | 'Local Guide' | 'Communicator' | 'Seasoned Traveler';

interface BadgeAwardResult {
  awarded: boolean;
  badgeId?: number;
  badgeName?: string;
  notificationMessage?: string;
}

export interface BadgeTierCounts {
  bronze: number;
  silver: number;
  gold: number;
}

/**
 * Award a badge to a user if they don't already have it
 */
export async function awardBadge(
  userId: number,
  badgeName: BadgeName,
  connection?: PoolConnection
): Promise<BadgeAwardResult> {
  const conn = connection || await pool.getConnection();
  const shouldRelease = !connection;

  try {
    // Get badge details
    const [badgeRows] = await conn.query<any[]>(
      'SELECT id, name, notification_message FROM badges WHERE name = ?',
      [badgeName]
    );

    if (badgeRows.length === 0) {
      return { awarded: false };
    }

    const badge = badgeRows[0];

    // Check if user already has this badge
    const [existingBadges] = await conn.query<any[]>(
      'SELECT id FROM user_badges WHERE user_id = ? AND badge_id = ?',
      [userId, badge.id]
    );

    if (existingBadges.length > 0) {
      return { awarded: false }; // Already has badge
    }

    // Award the badge
    await conn.query(
      'INSERT INTO user_badges (user_id, badge_id) VALUES (?, ?)',
      [userId, badge.id]
    );

    // Create notification
    await conn.query(
      `INSERT INTO notifications (user_id, type, message, actor_id, question_id)
       VALUES (?, 'badge', ?, NULL, NULL)`,
      [userId, badge.notification_message]
    );

    return {
      awarded: true,
      badgeId: badge.id,
      badgeName: badge.name,
      notificationMessage: badge.notification_message
    };
  } finally {
    if (shouldRelease) {
      conn.release();
    }
  }
}

/**
 * Check and award "Ayubowan" badge
 * Requires: email verified AND (bio OR home_country OR display_name filled)
 */
export async function checkAyubowanBadge(userId: number): Promise<BadgeAwardResult> {
  const connection = await pool.getConnection();
  try {
    const [userRows] = await connection.query<any[]>(
      `SELECT email_verified, bio, home_country, display_name 
       FROM users 
       WHERE id = ?`,
      [userId]
    );

    if (userRows.length === 0) {
      return { awarded: false };
    }

    const user = userRows[0];
    const hasProfile = (user.bio && user.bio.trim()) || 
                       (user.home_country && user.home_country.trim()) ||
                       (user.display_name && user.display_name.trim());
    
    if (user.email_verified && hasProfile) {
      return await awardBadge(userId, 'Ayubowan', connection);
    }

    return { awarded: false };
  } finally {
    connection.release();
  }
}

/**
 * Check and award "First Landing" badge
 * Requires: First question with score >= 1 OR not deleted within 24h
 */
export async function checkFirstLandingBadge(
  userId: number,
  questionId: number
): Promise<BadgeAwardResult> {
  const connection = await pool.getConnection();
  try {
    // Check if user already asked a question before this one
    const [previousQuestions] = await connection.query<any[]>(
      'SELECT COUNT(*) as count FROM questions WHERE user_id = ? AND id < ?',
      [userId, questionId]
    );

    if (previousQuestions[0].count > 0) {
      return { awarded: false }; // Not their first question
    }

    // Check if question meets criteria
    const [questionRows] = await connection.query<any[]>(
      `SELECT score, created_at 
       FROM questions 
       WHERE id = ? AND user_id = ?`,
      [questionId, userId]
    );

    if (questionRows.length === 0) {
      return { awarded: false };
    }

    const question = questionRows[0];
    const createdAt = new Date(question.created_at);
    const now = new Date();
    const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

    // Award if score >= 1 OR survived 24 hours
    if (question.score >= 1 || hoursSinceCreation >= 24) {
      return await awardBadge(userId, 'First Landing', connection);
    }

    return { awarded: false };
  } finally {
    connection.release();
  }
}

/**
 * Update progress for "Rice & Curry" badge
 * Requires: 10 upvotes cast on others' content
 */
export async function updateRiceAndCurryProgress(userId: number): Promise<BadgeAwardResult> {
  const connection = await pool.getConnection();
  try {
    // Get badge ID
    const [badgeRows] = await connection.query<any[]>(
      'SELECT id FROM badges WHERE name = ?',
      ['Rice & Curry']
    );

    if (badgeRows.length === 0) {
      return { awarded: false };
    }

    const badgeId = badgeRows[0].id;

    // Count total upvotes cast by user (excluding self-votes)
    const [voteRows] = await connection.query<any[]>(
      `SELECT COUNT(*) as count FROM (
        SELECT v.id FROM votes v
        INNER JOIN questions q ON v.votable_id = q.id
        WHERE v.user_id = ? AND v.vote_type = 1 AND v.votable_type = 'question' AND q.user_id != ?
        UNION ALL
        SELECT v.id FROM votes v
        INNER JOIN answers a ON v.votable_id = a.id
        WHERE v.user_id = ? AND v.vote_type = 1 AND v.votable_type = 'answer' AND a.user_id != ?
      ) as all_upvotes`,
      [userId, userId, userId, userId]
    );

    const upvoteCount = voteRows[0].count;

    // Update or create progress
    await connection.query(
      `INSERT INTO badge_progress (user_id, badge_id, progress, target)
       VALUES (?, ?, ?, 10)
       ON DUPLICATE KEY UPDATE progress = VALUES(progress)`,
      [userId, badgeId, upvoteCount]
    );

    // Award badge if target reached
    if (upvoteCount >= 10) {
      return await awardBadge(userId, 'Rice & Curry', connection);
    }

    return { awarded: false };
  } finally {
    connection.release();
  }
}

/**
 * Check and award "Snapshot" badge
 * Requires: Post with image that received 5 upvotes
 */
export async function checkSnapshotBadge(
  userId: number,
  contentType: 'question' | 'answer',
  contentId: number
): Promise<BadgeAwardResult> {
  const connection = await pool.getConnection();
  try {
    const table = contentType === 'question' ? 'questions' : 'answers';
    
    // Check if content has image and score >= 5
    const [contentRows] = await connection.query<any[]>(
      `SELECT body, score FROM ${table} WHERE id = ? AND user_id = ?`,
      [contentId, userId]
    );

    if (contentRows.length === 0) {
      return { awarded: false };
    }

    const content = contentRows[0];
    
    // Check if body contains markdown image syntax or <img> tag
    const hasImage = /!\[.*?\]\(.*?\)|<img\s+[^>]*src=/.test(content.body);

    if (hasImage && content.score >= 5) {
      return await awardBadge(userId, 'Snapshot', connection);
    }

    return { awarded: false };
  } finally {
    connection.release();
  }
}

/**
 * Get badge tier counts for a user
 */
export async function getBadgeTierCounts(userId: number): Promise<BadgeTierCounts> {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query<any[]>(
      `SELECT b.tier, COUNT(*) as count
       FROM user_badges ub
       JOIN badges b ON ub.badge_id = b.id
       WHERE ub.user_id = ?
       GROUP BY b.tier`,
      [userId]
    );

    const counts: BadgeTierCounts = { bronze: 0, silver: 0, gold: 0 };
    
    rows.forEach((row: any) => {
      const tier = row.tier.toLowerCase() as keyof BadgeTierCounts;
      if (tier in counts) {
        counts[tier] = row.count;
      }
    });

    return counts;
  } finally {
    connection.release();
  }
}

// ============================================================================
// SILVER TIER BADGES
// ============================================================================

/**
 * Check and award "Price Police" badge
 * Requires: User flagged content as "Outdated Price" which was then confirmed and hidden
 */
export async function checkPricePoliceBadge(
  userId: number,
  reviewQueueId: number
): Promise<BadgeAwardResult> {
  const connection = await pool.getConnection();
  try {
    // Check if this review queue item was flagged by this user and resulted in content being hidden
    const [reviewRows] = await connection.query<any[]>(
      `SELECT rq.id, cf.id as flag_id
       FROM review_queue rq
       LEFT JOIN content_flags cf ON cf.review_queue_id = rq.id
       WHERE rq.id = ? 
         AND rq.flagged_by = ? 
         AND rq.review_type = 'outdated'
         AND rq.status = 'completed'
         AND cf.flag_type = 'outdated'
         AND cf.is_active = TRUE`,
      [reviewQueueId, userId]
    );

    if (reviewRows.length === 0) {
      return { awarded: false };
    }

    // Award the badge - they successfully flagged outdated content
    return await awardBadge(userId, 'Price Police', connection);
  } finally {
    connection.release();
  }
}

/**
 * Check and award "Local Guide" badge
 * Requires: 10 answers within a specific location tag with combined score of 20+
 */
export async function checkLocalGuideBadge(
  userId: number,
  tagName: string
): Promise<BadgeAwardResult> {
  const connection = await pool.getConnection();
  try {
    // Count answers and total score for this user in this tag
    const [statsRows] = await connection.query<any[]>(
      `SELECT COUNT(DISTINCT a.id) as answer_count, COALESCE(SUM(a.score), 0) as total_score
       FROM answers a
       JOIN questions q ON a.question_id = q.id
       JOIN question_tags qt ON q.id = qt.question_id
       JOIN tags t ON qt.tag_id = t.id
       WHERE a.user_id = ? 
         AND t.name = ?`,
      [userId, tagName]
    );

    if (statsRows.length === 0) {
      return { awarded: false };
    }

    const stats = statsRows[0];
    
    // Check if requirements met: 10+ answers with 20+ combined score
    if (stats.answer_count >= 10 && stats.total_score >= 20) {
      return await awardBadge(userId, 'Local Guide', connection);
    }

    return { awarded: false };
  } finally {
    connection.release();
  }
}

/**
 * Update progress for "Communicator" badge
 * Requires: 5 conversations in comments that led to an accepted answer
 * Call this when an answer is accepted that has comments from this user
 */
export async function updateCommunicatorProgress(userId: number): Promise<BadgeAwardResult> {
  const connection = await pool.getConnection();
  try {
    // Get badge ID
    const [badgeRows] = await connection.query<any[]>(
      'SELECT id FROM badges WHERE name = ?',
      ['Communicator']
    );

    if (badgeRows.length === 0) {
      return { awarded: false };
    }

    const badgeId = badgeRows[0].id;

    // Count distinct accepted answers where user commented on the answer
    const [countRows] = await connection.query<any[]>(
      `SELECT COUNT(DISTINCT a.id) as count
       FROM answers a
       JOIN comments c ON c.commentable_type = 'answer' AND c.commentable_id = a.id
       WHERE a.is_accepted = TRUE
         AND c.user_id = ?
         AND a.user_id != ?`,
      [userId, userId] // User commented, but didn't write the answer
    );

    const conversationCount = countRows[0].count;

    // Update progress
    await connection.query(
      `INSERT INTO badge_progress (user_id, badge_id, progress, target)
       VALUES (?, ?, ?, 5)
       ON DUPLICATE KEY UPDATE progress = VALUES(progress)`,
      [userId, badgeId, conversationCount]
    );

    // Award badge if target reached
    if (conversationCount >= 5) {
      return await awardBadge(userId, 'Communicator', connection);
    }

    return { awarded: false };
  } finally {
    connection.release();
  }
}

/**
 * Update user's login streak and check for Seasoned Traveler badge
 * Call this whenever a user logs in or visits the site
 */
export async function updateLoginStreak(userId: number): Promise<BadgeAwardResult> {
  const connection = await pool.getConnection();
  try {
    // Get user's current streak data
    const [userRows] = await connection.query<any[]>(
      'SELECT last_login_at, current_streak, longest_streak FROM users WHERE id = ?',
      [userId]
    );

    if (userRows.length === 0) {
      return { awarded: false };
    }

    const user = userRows[0];
    const now = new Date();
    const lastLogin = user.last_login_at ? new Date(user.last_login_at) : null;

    let newStreak = 1;
    let newLongest = user.longest_streak || 0;

    if (lastLogin) {
      // Calculate days between logins
      const daysSinceLastLogin = Math.floor((now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceLastLogin === 0) {
        // Same day - no change to streak
        return { awarded: false };
      } else if (daysSinceLastLogin === 1) {
        // Consecutive day - increment streak
        newStreak = (user.current_streak || 0) + 1;
      } else {
        // Streak broken - reset to 1
        newStreak = 1;
      }
    }

    // Update longest streak if current is higher
    if (newStreak > newLongest) {
      newLongest = newStreak;
    }

    // Update user record
    await connection.query(
      `UPDATE users 
       SET last_login_at = ?, current_streak = ?, longest_streak = ?
       WHERE id = ?`,
      [now, newStreak, newLongest, userId]
    );

    // Check for Seasoned Traveler badge (30 day streak)
    if (newStreak >= 30) {
      return await awardBadge(userId, 'Seasoned Traveler', connection);
    }

    return { awarded: false };
  } finally {
    connection.release();
  }
}
