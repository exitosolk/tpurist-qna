import { query } from './db';

export type BanLevel = 'warning' | 'week' | 'month' | 'permanent';
export type StrikeType = 'downvote' | 'closed' | 'deleted';

interface QualityBan {
  id: number;
  userId: number;
  banLevel: BanLevel;
  totalStrikes: number;
  activeStrikes: number;
  isActive: boolean;
  bannedAt: Date;
  expiresAt: Date | null;
  banReason: string;
}

interface QualityStrike {
  id: number;
  userId: number;
  questionId: number;
  strikeType: StrikeType;
  strikeValue: number;
  isActive: boolean;
  createdAt: Date;
}

interface BanCheckResult {
  isBanned: boolean;
  ban?: QualityBan;
  message?: string;
}

/**
 * Check if a user is currently banned from asking questions
 */
export async function checkQualityBan(userId: number): Promise<BanCheckResult> {
  try {
    const result = await query(
      `SELECT * FROM user_quality_bans 
       WHERE user_id = ? 
       AND ban_type = 'question_ban' 
       AND is_active = TRUE
       AND (expires_at IS NULL OR expires_at > NOW())
       ORDER BY banned_at DESC
       LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return { isBanned: false };
    }

    const ban = result.rows[0];
    const banLevel = ban.ban_level as BanLevel;

    let message = '';
    switch (banLevel) {
      case 'warning':
        message = 'Warning: Your question quality is low. Continue posting poor questions and you will be temporarily banned.';
        return { isBanned: false, message }; // Warning doesn't block posting
      case 'week':
        message = `You are temporarily banned from asking questions until ${new Date(ban.expires_at).toLocaleDateString()}. Improve your existing questions by editing them and getting upvotes to lift this ban.`;
        break;
      case 'month':
        message = `You are banned from asking questions until ${new Date(ban.expires_at).toLocaleDateString()}. You must significantly improve your existing questions to lift this ban.`;
        break;
      case 'permanent':
        message = 'You are permanently banned from asking questions. The only way to regain this privilege is to substantially improve your existing questions.';
        break;
    }

    return {
      isBanned: true,
      ban: {
        id: ban.id,
        userId: ban.user_id,
        banLevel,
        totalStrikes: ban.total_strikes,
        activeStrikes: ban.active_strikes,
        isActive: ban.is_active,
        bannedAt: new Date(ban.banned_at),
        expiresAt: ban.expires_at ? new Date(ban.expires_at) : null,
        banReason: ban.ban_reason,
      },
      message,
    };
  } catch (error) {
    console.error('Error checking quality ban:', error);
    return { isBanned: false };
  }
}

/**
 * Record a quality strike against a user for a specific question
 */
export async function recordQualityStrike(
  userId: number,
  questionId: number,
  strikeType: StrikeType,
  reason?: string
): Promise<void> {
  try {
    console.log(`[Quality Ban] Recording ${strikeType} strike for user ${userId}, question ${questionId}`);
    
    // Get strike value from config
    const configKey = `strike_value_${strikeType}`;
    const configResult = await query(
      'SELECT config_value FROM quality_ban_config WHERE config_key = ?',
      [configKey]
    );

    const strikeValue = configResult.rows.length > 0 
      ? parseFloat(configResult.rows[0].config_value) 
      : 1.0;

    console.log(`[Quality Ban] Strike value for ${strikeType}: ${strikeValue}`);

    // Insert or update the strike
    await query(
      `INSERT INTO question_quality_strikes 
       (user_id, question_id, strike_type, strike_value, strike_reason, is_active)
       VALUES (?, ?, ?, ?, ?, TRUE)
       ON DUPLICATE KEY UPDATE 
       strike_value = VALUES(strike_value),
       strike_reason = VALUES(strike_reason),
       is_active = TRUE`,
      [userId, questionId, strikeType, strikeValue, reason || `Question received ${strikeType}`]
    );

    // Update question quality metrics
    await updateQuestionQualityMetrics(questionId);

    console.log(`[Quality Ban] Evaluating ban status for user ${userId}...`);
    // Check if user should be banned
    await evaluateAndApplyBan(userId);
    console.log(`[Quality Ban] Ban evaluation complete for user ${userId}`);
  } catch (error) {
    console.error(`[Quality Ban] ERROR recording quality strike for user ${userId}:`, error);
    throw error; // Re-throw to see in parent
  }
}

/**
 * Update quality metrics for a specific question
 */
async function updateQuestionQualityMetrics(questionId: number): Promise<void> {
  try {
    // Count upvotes and downvotes
    const voteResult = await query(
      `SELECT 
        SUM(CASE WHEN vote_type = 1 THEN 1 ELSE 0 END) as upvotes,
        SUM(CASE WHEN vote_type = -1 THEN 1 ELSE 0 END) as downvotes
       FROM votes 
       WHERE votable_type = 'question' AND votable_id = ?`,
      [questionId]
    );

    const upvotes = voteResult.rows[0]?.upvotes || 0;
    const downvotes = voteResult.rows[0]?.downvotes || 0;
    const qualityScore = upvotes - downvotes;

    // Insert or update metrics
    await query(
      `INSERT INTO question_quality_metrics 
       (question_id, upvote_count, downvote_count, quality_score)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       upvote_count = VALUES(upvote_count),
       downvote_count = VALUES(downvote_count),
       quality_score = VALUES(quality_score)`,
      [questionId, upvotes, downvotes, qualityScore]
    );
  } catch (error) {
    console.error('Error updating question quality metrics:', error);
  }
}

/**
 * Evaluate user's quality and apply appropriate ban if needed
 */
async function evaluateAndApplyBan(userId: number): Promise<void> {
  try {
    // Calculate total active strikes
    const strikeResult = await query(
      `SELECT SUM(strike_value) as total_strikes
       FROM question_quality_strikes
       WHERE user_id = ? AND is_active = TRUE`,
      [userId]
    );

    const totalStrikes = parseFloat(strikeResult.rows[0]?.total_strikes || '0');
    console.log(`[Quality Ban] User ${userId} has ${totalStrikes} total strikes`);

    // Get thresholds from config
    const thresholds = await getQualityBanThresholds();
    console.log(`[Quality Ban] Thresholds:`, thresholds);

    // Determine ban level
    let banLevel: BanLevel | null = null;
    let duration: number | null = null;

    if (totalStrikes >= thresholds.permanent) {
      banLevel = 'permanent';
      duration = null; // Permanent ban
    } else if (totalStrikes >= thresholds.month) {
      banLevel = 'month';
      duration = thresholds.monthDuration;
    } else if (totalStrikes >= thresholds.week) {
      banLevel = 'week';
      duration = thresholds.weekDuration;
    } else if (totalStrikes >= thresholds.warning) {
      banLevel = 'warning';
      duration = null; // Warning doesn't expire
    }

    if (!banLevel) {
      console.log(`[Quality Ban] User ${userId} has ${totalStrikes} strikes - no ban needed`);
      return; // No ban needed
    }

    console.log(`[Quality Ban] User ${userId} should be banned at level: ${banLevel}, duration: ${duration} days`);

    // Check if user already has an active ban
    const existingBan = await query(
      `SELECT * FROM user_quality_bans 
       WHERE user_id = ? 
       AND ban_type = 'question_ban' 
       AND is_active = TRUE
       ORDER BY banned_at DESC
       LIMIT 1`,
      [userId]
    );

    const expiresAt = duration ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000) : null;
    const banReason = `Accumulated ${totalStrikes} quality strikes from low-quality questions.`;

    if (existingBan.rows.length > 0) {
      // Update existing ban if it's less severe
      const currentBan = existingBan.rows[0];
      const currentBanLevel = currentBan.ban_level as BanLevel;
      const levelOrder: Record<BanLevel, number> = { warning: 0, week: 1, month: 2, permanent: 3 };
      
      if (levelOrder[banLevel] > levelOrder[currentBanLevel]) {
        await query(
          `UPDATE user_quality_bans 
           SET ban_level = ?, 
               total_strikes = ?, 
               active_strikes = ?,
               expires_at = ?,
               ban_reason = ?,
               banned_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [banLevel, totalStrikes, totalStrikes, expiresAt, banReason, currentBan.id]
        );
      }
    } else {
      // Create new ban
      console.log(`[Quality Ban] Creating new ban for user ${userId}:`, { banLevel, totalStrikes, expiresAt });
      await query(
        `INSERT INTO user_quality_bans 
         (user_id, ban_type, ban_level, total_strikes, active_strikes, expires_at, ban_reason)
         VALUES (?, 'question_ban', ?, ?, ?, ?, ?)`,
        [userId, banLevel, totalStrikes, totalStrikes, expiresAt, banReason]
      );
      console.log(`[Quality Ban] Ban successfully created for user ${userId}`);
    }
  } catch (error) {
    console.error(`[Quality Ban] ERROR evaluating and applying ban for user ${userId}:`, error);
    throw error; // Re-throw to see the error in the parent call
  }
}

/**
 * Check if user has improved their questions and potentially lift ban
 */
export async function checkForQualityImprovement(userId: number): Promise<void> {
  try {
    // Get improvement thresholds from config
    const configResult = await query(
      `SELECT config_key, config_value FROM quality_ban_config 
       WHERE config_key IN ('improvement_min_score', 'strikes_removed_per_improvement')`,
      []
    );

    const config: Record<string, string> = {};
    configResult.rows.forEach((row: any) => {
      config[row.config_key] = row.config_value;
    });

    const minScore = parseInt(config.improvement_min_score || '2');
    const strikesPerImprovement = parseInt(config.strikes_removed_per_improvement || '1');

    // Find questions that were improved (edited after strike and now have positive score)
    const improvedQuestions = await query(
      `SELECT DISTINCT qqs.question_id, qqs.id as strike_id
       FROM question_quality_strikes qqs
       INNER JOIN question_quality_metrics qqm ON qqs.question_id = qqm.question_id
       INNER JOIN questions q ON qqs.question_id = q.id
       WHERE qqs.user_id = ? 
       AND qqs.is_active = TRUE
       AND qqm.quality_score >= ?
       AND q.updated_at > qqs.created_at`,
      [userId, minScore]
    );

    if (improvedQuestions.rows.length === 0) {
      return; // No improvements found
    }

    // Remove strikes from improved questions
    for (const improved of improvedQuestions.rows) {
      await query(
        `UPDATE question_quality_strikes 
         SET is_active = FALSE, removed_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [improved.strike_id]
      );
    }

    // Recalculate total active strikes
    const strikeResult = await query(
      `SELECT SUM(strike_value) as total_strikes
       FROM question_quality_strikes
       WHERE user_id = ? AND is_active = TRUE`,
      [userId]
    );

    const totalStrikes = parseFloat(strikeResult.rows[0]?.total_strikes || '0');

    // Update or lift ban based on new strike count
    const thresholds = await getQualityBanThresholds();

    if (totalStrikes < thresholds.warning) {
      // Lift all bans
      await query(
        `UPDATE user_quality_bans 
         SET is_active = FALSE, 
             lifted_at = CURRENT_TIMESTAMP,
             lift_reason = 'User improved their questions'
         WHERE user_id = ? AND ban_type = 'question_ban' AND is_active = TRUE`,
        [userId]
      );
    } else {
      // Downgrade ban level if applicable
      let newLevel: BanLevel | null = null;
      
      if (totalStrikes >= thresholds.month) {
        newLevel = 'month';
      } else if (totalStrikes >= thresholds.week) {
        newLevel = 'week';
      } else if (totalStrikes >= thresholds.warning) {
        newLevel = 'warning';
      }

      if (newLevel) {
        await query(
          `UPDATE user_quality_bans 
           SET ban_level = ?, 
               active_strikes = ?,
               lift_reason = 'Ban downgraded due to question improvements'
           WHERE user_id = ? AND ban_type = 'question_ban' AND is_active = TRUE`,
          [newLevel, totalStrikes, userId]
        );
      }
    }
  } catch (error) {
    console.error('Error checking for quality improvement:', error);
  }
}

/**
 * Get quality ban thresholds from configuration
 */
async function getQualityBanThresholds(): Promise<{
  warning: number;
  week: number;
  month: number;
  permanent: number;
  weekDuration: number;
  monthDuration: number;
}> {
  try {
    const result = await query(
      `SELECT config_key, config_value FROM quality_ban_config 
       WHERE config_key IN (
         'strikes_for_warning', 'strikes_for_week_ban', 
         'strikes_for_month_ban', 'strikes_for_permanent_ban',
         'week_ban_duration', 'month_ban_duration'
       )`,
      []
    );

    const config: Record<string, string> = {};
    result.rows.forEach((row: any) => {
      config[row.config_key] = row.config_value;
    });

    return {
      warning: parseInt(config.strikes_for_warning || '3'),
      week: parseInt(config.strikes_for_week_ban || '5'),
      month: parseInt(config.strikes_for_month_ban || '8'),
      permanent: parseInt(config.strikes_for_permanent_ban || '12'),
      weekDuration: parseInt(config.week_ban_duration || '7'),
      monthDuration: parseInt(config.month_ban_duration || '30'),
    };
  } catch (error) {
    console.error('Error getting quality ban thresholds:', error);
    // Return defaults
    return {
      warning: 3,
      week: 5,
      month: 8,
      permanent: 12,
      weekDuration: 7,
      monthDuration: 30,
    };
  }
}

/**
 * Mark a question as closed (admin action)
 */
export async function markQuestionClosed(
  questionId: number,
  closeReason: string
): Promise<void> {
  try {
    // Update question quality metrics
    await query(
      `INSERT INTO question_quality_metrics 
       (question_id, is_closed, close_reason, closed_at)
       VALUES (?, TRUE, ?, CURRENT_TIMESTAMP)
       ON DUPLICATE KEY UPDATE
       is_closed = TRUE,
       close_reason = VALUES(close_reason),
       closed_at = CURRENT_TIMESTAMP`,
      [questionId, closeReason]
    );

    // Get question author
    const questionResult = await query(
      'SELECT user_id FROM questions WHERE id = ?',
      [questionId]
    );

    if (questionResult.rows.length > 0) {
      const userId = questionResult.rows[0].user_id;
      await recordQualityStrike(userId, questionId, 'closed', closeReason);
    }
  } catch (error) {
    console.error('Error marking question as closed:', error);
  }
}
