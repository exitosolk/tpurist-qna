// Question closure utility functions
import { PoolConnection } from 'mysql2/promise';
import pool from './db';
import { recordQualityStrike } from './quality-ban';

export interface CloseReason {
  id: number;
  reasonKey: string;
  displayName: string;
  description: string;
  requiresDetails: boolean;
}

export interface CloseVoteCount {
  reasonKey: string;
  reasonDisplayName: string;
  voteCount: number;
  votesNeeded: number;
}

export interface ClosureConfig {
  closeVotesNeeded: number;
  reopenVotesNeeded: number;
  minReputationClose: number;
  minReputationReopen: number;
  autoCloseScoreThreshold: number;
  autoCloseEnabled: boolean;
  goldBadgeHammerEnabled: boolean;
}

/**
 * Get closure system configuration
 */
export async function getClosureConfig(): Promise<ClosureConfig> {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query<any[]>(
      'SELECT config_key, config_value FROM closure_config'
    );

    const config: any = {};
    rows.forEach(row => {
      config[row.config_key] = row.config_value;
    });

    return {
      closeVotesNeeded: parseInt(config.close_votes_needed || '5'),
      reopenVotesNeeded: parseInt(config.reopen_votes_needed || '5'),
      minReputationClose: parseInt(config.min_reputation_close || '500'),
      minReputationReopen: parseInt(config.min_reputation_reopen || '500'),
      autoCloseScoreThreshold: parseInt(config.auto_close_score_threshold || '-5'),
      autoCloseEnabled: config.auto_close_enabled === 'true',
      goldBadgeHammerEnabled: config.gold_badge_hammer_enabled === 'true',
    };
  } finally {
    connection.release();
  }
}

/**
 * Get all available close reasons
 */
export async function getCloseReasons(): Promise<CloseReason[]> {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query<any[]>(
      `SELECT id, reason_key, display_name, description, requires_details 
       FROM close_reasons 
       WHERE is_active = TRUE 
       ORDER BY id`
    );

    return rows.map(row => ({
      id: row.id,
      reasonKey: row.reason_key,
      displayName: row.display_name,
      description: row.description,
      requiresDetails: row.requires_details === 1,
    }));
  } finally {
    connection.release();
  }
}

/**
 * Close a question (either by community vote or automatically)
 */
export async function closeQuestion(
  questionId: number,
  closeReasonKey: string,
  closeDetails: string | null,
  closedByUserId: number | null,
  isAutomatic: boolean = false,
  connection?: PoolConnection
): Promise<void> {
  const conn = connection || await pool.getConnection();
  const shouldRelease = !connection;

  try {
    // Get question owner for quality strike
    const [questionRows] = await conn.query<any[]>(
      'SELECT user_id, score FROM questions WHERE id = ?',
      [questionId]
    );

    if (questionRows.length === 0) {
      throw new Error('Question not found');
    }

    const questionOwnerId = questionRows[0].user_id;
    const currentScore = questionRows[0].score;

    // Update question to closed status
    await conn.query(
      `UPDATE questions 
       SET is_closed = TRUE, 
           closed_at = NOW(), 
           closed_by = ?, 
           close_reason = ?,
           close_details = ?,
           auto_closed = ?
       WHERE id = ?`,
      [closedByUserId, closeReasonKey, closeDetails, isAutomatic, questionId]
    );

    // If automatic closure, log it
    if (isAutomatic) {
      await conn.query(
        'INSERT INTO auto_closure_log (question_id, score_at_closure) VALUES (?, ?)',
        [questionId, currentScore]
      );
    }

    // Deactivate all pending close votes
    await conn.query(
      'UPDATE question_close_votes SET is_active = FALSE WHERE question_id = ?',
      [questionId]
    );

    // Record quality strike for question owner (2.0 strikes for closed question)
    await recordQualityStrike(questionOwnerId, questionId, 'closed');

    // Create notification for question owner
    const closeMessage = isAutomatic
      ? `Your question was automatically closed due to low score (${closeReasonKey})`
      : `Your question was closed: ${closeReasonKey}`;

    await conn.query(
      `INSERT INTO notifications (user_id, type, message, actor_id, question_id)
       VALUES (?, 'question_closed', ?, ?, ?)`,
      [questionOwnerId, closeMessage, closedByUserId, questionId]
    );
  } finally {
    if (shouldRelease) {
      conn.release();
    }
  }
}

/**
 * Reopen a closed question
 */
export async function reopenQuestion(
  questionId: number,
  reopenedByUserId: number | null,
  connection?: PoolConnection
): Promise<void> {
  const conn = connection || await pool.getConnection();
  const shouldRelease = !connection;

  try {
    // Get question owner
    const [questionRows] = await conn.query<any[]>(
      'SELECT user_id, is_closed FROM questions WHERE id = ?',
      [questionId]
    );

    if (questionRows.length === 0) {
      throw new Error('Question not found');
    }

    if (!questionRows[0].is_closed) {
      throw new Error('Question is not closed');
    }

    const questionOwnerId = questionRows[0].user_id;

    // Reopen the question
    await conn.query(
      `UPDATE questions 
       SET is_closed = FALSE, 
           closed_at = NULL, 
           closed_by = NULL, 
           close_reason = NULL,
           close_details = NULL,
           auto_closed = FALSE
       WHERE id = ?`,
      [questionId]
    );

    // Deactivate all pending reopen votes
    await conn.query(
      'UPDATE question_reopen_votes SET is_active = FALSE WHERE question_id = ?',
      [questionId]
    );

    // Remove the quality strike for this closed question
    await conn.query(
      `UPDATE question_quality_strikes 
       SET is_active = FALSE 
       WHERE question_id = ? AND strike_type = 'closed'`,
      [questionId]
    );

    // Create notification for question owner
    await conn.query(
      `INSERT INTO notifications (user_id, type, message, actor_id, question_id)
       VALUES (?, 'question_reopened', 'Your question was reopened by the community', ?, ?)`,
      [questionOwnerId, reopenedByUserId, questionId]
    );
  } finally {
    if (shouldRelease) {
      conn.release();
    }
  }
}

/**
 * Check if user has gold badge "hammer" privilege for a question
 * Gold badge holders can close questions with single vote in their tag
 */
export async function hasGoldBadgeHammer(
  userId: number,
  questionId: number
): Promise<boolean> {
  const connection = await pool.getConnection();
  try {
    const config = await getClosureConfig();
    if (!config.goldBadgeHammerEnabled) {
      return false;
    }

    // Check if user has gold badge in any of the question's tags
    const [rows] = await connection.query<any[]>(
      `SELECT COUNT(*) as has_hammer
       FROM user_tag_badges utb
       JOIN question_tags qt ON utb.tag_id = qt.tag_id
       WHERE utb.user_id = ? 
         AND qt.question_id = ? 
         AND utb.badge_tier = 'gold'
         AND utb.is_active = TRUE`,
      [userId, questionId]
    );

    return rows[0]?.has_hammer > 0;
  } finally {
    connection.release();
  }
}

/**
 * Get close vote counts for a question
 */
export async function getCloseVoteCounts(questionId: number): Promise<CloseVoteCount[]> {
  const connection = await pool.getConnection();
  try {
    const config = await getClosureConfig();
    const [rows] = await connection.query<any[]>(
      `SELECT reason_key, reason_display_name, vote_count
       FROM question_close_vote_counts
       WHERE question_id = ?
       ORDER BY vote_count DESC`,
      [questionId]
    );

    return rows.map(row => ({
      reasonKey: row.reason_key,
      reasonDisplayName: row.reason_display_name,
      voteCount: row.vote_count,
      votesNeeded: config.closeVotesNeeded,
    }));
  } finally {
    connection.release();
  }
}

/**
 * Check if a question should be automatically closed based on score
 * Call this after each downvote on a question
 */
export async function checkAutoClose(questionId: number): Promise<boolean> {
  const connection = await pool.getConnection();
  try {
    const config = await getClosureConfig();
    
    if (!config.autoCloseEnabled) {
      return false;
    }

    // Get question details
    const [questionRows] = await connection.query<any[]>(
      'SELECT score, is_closed FROM questions WHERE id = ?',
      [questionId]
    );

    if (questionRows.length === 0 || questionRows[0].is_closed) {
      return false;
    }

    const score = questionRows[0].score;

    // Check if score has reached threshold
    if (score <= config.autoCloseScoreThreshold) {
      await closeQuestion(
        questionId,
        'low_quality',
        `Automatically closed due to low score (${score})`,
        null, // No user - automatic
        true, // Is automatic
        connection
      );
      return true;
    }

    return false;
  } finally {
    connection.release();
  }
}

/**
 * Expire old close votes (cleanup task)
 * Should be run periodically (e.g., daily cron job)
 */
export async function expireOldCloseVotes(): Promise<number> {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query<any[]>(
      `SELECT config_value FROM closure_config WHERE config_key = 'close_vote_aging_days'`
    );

    const agingDays = parseInt(rows[0]?.config_value || '7');

    const [result] = await connection.query<any>(
      `UPDATE question_close_votes 
       SET is_active = FALSE 
       WHERE is_active = TRUE 
         AND voted_at < DATE_SUB(NOW(), INTERVAL ? DAY)
         AND question_id NOT IN (SELECT id FROM questions WHERE is_closed = TRUE)`,
      [agingDays]
    );

    return result.affectedRows || 0;
  } finally {
    connection.release();
  }
}

/**
 * Check if user has already voted to close a question
 */
export async function hasUserVotedToClose(
  userId: number,
  questionId: number
): Promise<boolean> {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query<any[]>(
      `SELECT id FROM question_close_votes 
       WHERE user_id = ? AND question_id = ? AND is_active = TRUE`,
      [userId, questionId]
    );

    return rows.length > 0;
  } finally {
    connection.release();
  }
}

/**
 * Check if user has already voted to reopen a question
 */
export async function hasUserVotedToReopen(
  userId: number,
  questionId: number
): Promise<boolean> {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query<any[]>(
      `SELECT id FROM question_reopen_votes 
       WHERE user_id = ? AND question_id = ? AND is_active = TRUE`,
      [userId, questionId]
    );

    return rows.length > 0;
  } finally {
    connection.release();
  }
}
