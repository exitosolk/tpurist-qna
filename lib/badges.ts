// Badge awarding utility functions
import { PoolConnection } from 'mysql2/promise';
import pool from './db';

export type BadgeName = 'Ayubowan' | 'First Landing' | 'Rice & Curry' | 'Snapshot';

interface BadgeAwardResult {
  awarded: boolean;
  badgeId?: number;
  badgeName?: string;
  notificationMessage?: string;
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
      `INSERT INTO notifications (user_id, type, content, reference_type, reference_id)
       VALUES (?, 'badge', ?, 'badge', ?)`,
      [userId, badge.notification_message, badge.id]
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
 * Requires: email verified AND (bio OR home_country filled)
 */
export async function checkAyubowanBadge(userId: number): Promise<BadgeAwardResult> {
  const connection = await pool.getConnection();
  try {
    const [userRows] = await connection.query<any[]>(
      `SELECT email_verified, bio, home_country 
       FROM users 
       WHERE id = ?`,
      [userId]
    );

    if (userRows.length === 0) {
      return { awarded: false };
    }

    const user = userRows[0];
    const hasProfile = (user.bio && user.bio.trim()) || (user.home_country && user.home_country.trim());
    
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
        INNER JOIN questions q ON v.question_id = q.id
        WHERE v.user_id = ? AND v.vote_type = 'up' AND q.user_id != ?
        UNION ALL
        SELECT v.id FROM votes v
        INNER JOIN answers a ON v.answer_id = a.id
        WHERE v.user_id = ? AND v.vote_type = 'up' AND a.user_id != ?
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
