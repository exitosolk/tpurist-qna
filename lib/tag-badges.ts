import { query } from './db';

export type TagBadgeTier = 'bronze' | 'silver' | 'gold';
export type TagActivityType = 'upvote' | 'accepted_answer' | 'bounty';

interface TagBadgeConfig {
  badgeTier: TagBadgeTier;
  minScore: number;
  minAcceptedAnswers: number;
  requiresFreshness: boolean;
  freshnessPointsRequired: number;
  freshnessPeriodMonths: number;
  description: string;
  superpower: string;
}

interface UserTagBadge {
  id: number;
  userId: number;
  tagId: number;
  badgeTier: TagBadgeTier;
  earnedAt: Date;
  isActive: boolean;
  lastFreshnessCheck: Date | null;
  freshnessScoreSinceCheck: number;
  markedInactiveAt: Date | null;
}

interface UserTagScore {
  userId: number;
  tagId: number;
  totalScore: number;
  acceptedAnswersCount: number;
  lastActivityAt: Date;
}

interface BadgeCheckResult {
  hasBadge: boolean;
  tier?: TagBadgeTier;
  isActive?: boolean;
  canRetag?: boolean;
  canHammer?: boolean;
}

/**
 * Get tag badge configuration
 */
async function getTagBadgeConfig(): Promise<Record<TagBadgeTier, TagBadgeConfig>> {
  const result = await query(
    `SELECT 
      badge_tier,
      min_score,
      min_accepted_answers,
      requires_freshness,
      freshness_points_required,
      freshness_period_months,
      description,
      superpower
    FROM tag_badge_config`,
    []
  );

  const config: Record<string, TagBadgeConfig> = {};
  result.rows.forEach((row: any) => {
    config[row.badge_tier] = {
      badgeTier: row.badge_tier,
      minScore: row.min_score,
      minAcceptedAnswers: row.min_accepted_answers,
      requiresFreshness: row.requires_freshness,
      freshnessPointsRequired: row.freshness_points_required,
      freshnessPeriodMonths: row.freshness_period_months,
      description: row.description,
      superpower: row.superpower,
    };
  });

  return config as Record<TagBadgeTier, TagBadgeConfig>;
}

/**
 * Update user's score in a specific tag
 */
export async function updateUserTagScore(
  userId: number,
  tagId: number,
  pointsEarned: number,
  isAcceptedAnswer: boolean = false
): Promise<void> {
  try {
    // Update or create tag score
    await query(
      `INSERT INTO user_tag_scores 
        (user_id, tag_id, total_score, accepted_answers_count, last_activity_at)
      VALUES (?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        total_score = total_score + ?,
        accepted_answers_count = accepted_answers_count + ?,
        last_activity_at = NOW()`,
      [userId, tagId, pointsEarned, isAcceptedAnswer ? 1 : 0, pointsEarned, isAcceptedAnswer ? 1 : 0]
    );

    // Check if user now qualifies for a badge
    await checkAndAwardBadges(userId, tagId);
  } catch (error) {
    console.error('Error updating user tag score:', error);
  }
}

/**
 * Record tag badge activity for freshness tracking
 */
export async function recordTagActivity(
  userId: number,
  tagId: number,
  activityType: TagActivityType,
  pointsEarned: number,
  questionId?: number,
  answerId?: number
): Promise<void> {
  try {
    await query(
      `INSERT INTO tag_badge_activity 
        (user_id, tag_id, activity_type, points_earned, question_id, answer_id)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, tagId, activityType, pointsEarned, questionId || null, answerId || null]
    );

    // Update freshness score for any active gold badges
    await query(
      `UPDATE user_tag_badges
      SET freshness_score_since_check = freshness_score_since_check + ?
      WHERE user_id = ? 
        AND tag_id = ? 
        AND badge_tier = 'gold' 
        AND is_active = TRUE`,
      [pointsEarned, userId, tagId]
    );
  } catch (error) {
    console.error('Error recording tag activity:', error);
  }
}

/**
 * Check and award appropriate badges based on current score
 */
async function checkAndAwardBadges(userId: number, tagId: number): Promise<void> {
  try {
    // Get user's current score in this tag
    const scoreResult = await query(
      `SELECT total_score, accepted_answers_count 
      FROM user_tag_scores 
      WHERE user_id = ? AND tag_id = ?`,
      [userId, tagId]
    );

    if (scoreResult.rows.length === 0) {
      return;
    }

    const { total_score, accepted_answers_count } = scoreResult.rows[0];
    const config = await getTagBadgeConfig();

    // Check for Gold badge
    if (
      total_score >= config.gold.minScore &&
      accepted_answers_count >= config.gold.minAcceptedAnswers
    ) {
      await awardBadge(userId, tagId, 'gold');
    }
    // Check for Silver badge
    else if (
      total_score >= config.silver.minScore &&
      accepted_answers_count >= config.silver.minAcceptedAnswers
    ) {
      await awardBadge(userId, tagId, 'silver');
    }
    // Check for Bronze badge
    else if (total_score >= config.bronze.minScore) {
      await awardBadge(userId, tagId, 'bronze');
    }
  } catch (error) {
    console.error('Error checking and awarding badges:', error);
  }
}

/**
 * Award a badge to a user for a specific tag
 */
async function awardBadge(
  userId: number,
  tagId: number,
  tier: TagBadgeTier
): Promise<void> {
  try {
    // Check if badge already exists
    const existingBadge = await query(
      `SELECT id FROM user_tag_badges 
      WHERE user_id = ? AND tag_id = ? AND badge_tier = ?`,
      [userId, tagId, tier]
    );

    if (existingBadge.rows.length > 0) {
      return; // Badge already awarded
    }

    // Award the badge
    await query(
      `INSERT INTO user_tag_badges 
        (user_id, tag_id, badge_tier, is_active, last_freshness_check, freshness_score_since_check)
      VALUES (?, ?, ?, TRUE, NOW(), 0)`,
      [userId, tagId, tier]
    );

    // TODO: Create notification for badge earned
    console.log(`Awarded ${tier} badge for tag ${tagId} to user ${userId}`);
  } catch (error) {
    console.error('Error awarding badge:', error);
  }
}

/**
 * Check if user has a specific badge tier for a tag
 */
export async function checkUserTagBadge(
  userId: number,
  tagId: number,
  tier?: TagBadgeTier
): Promise<BadgeCheckResult> {
  try {
    let sql = `SELECT badge_tier, is_active 
               FROM user_tag_badges 
               WHERE user_id = ? AND tag_id = ?`;
    const params: any[] = [userId, tagId];

    if (tier) {
      sql += ` AND badge_tier = ?`;
      params.push(tier);
    }

    sql += ` ORDER BY 
               CASE badge_tier 
                 WHEN 'gold' THEN 3 
                 WHEN 'silver' THEN 2 
                 WHEN 'bronze' THEN 1 
               END DESC 
             LIMIT 1`;

    const result = await query(sql, params);

    if (result.rows.length === 0) {
      return { hasBadge: false };
    }

    const badge = result.rows[0];
    const badgeTier = badge.badge_tier as TagBadgeTier;
    const isActive = badge.is_active;

    return {
      hasBadge: true,
      tier: badgeTier,
      isActive,
      canRetag: (badgeTier === 'silver' || badgeTier === 'gold') && isActive,
      canHammer: badgeTier === 'gold' && isActive,
    };
  } catch (error) {
    console.error('Error checking user tag badge:', error);
    return { hasBadge: false };
  }
}

/**
 * Get user's highest badge for a tag
 */
export async function getUserHighestTagBadge(
  userId: number,
  tagId: number
): Promise<UserTagBadge | null> {
  try {
    const result = await query(
      `SELECT * FROM user_tag_badges 
       WHERE user_id = ? AND tag_id = ?
       ORDER BY 
         CASE badge_tier 
           WHEN 'gold' THEN 3 
           WHEN 'silver' THEN 2 
           WHEN 'bronze' THEN 1 
         END DESC 
       LIMIT 1`,
      [userId, tagId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      tagId: row.tag_id,
      badgeTier: row.badge_tier,
      earnedAt: new Date(row.earned_at),
      isActive: row.is_active,
      lastFreshnessCheck: row.last_freshness_check ? new Date(row.last_freshness_check) : null,
      freshnessScoreSinceCheck: row.freshness_score_since_check,
      markedInactiveAt: row.marked_inactive_at ? new Date(row.marked_inactive_at) : null,
    };
  } catch (error) {
    console.error('Error getting user highest tag badge:', error);
    return null;
  }
}

/**
 * Get all badges for a user
 */
export async function getUserTagBadges(userId: number): Promise<UserTagBadge[]> {
  try {
    const result = await query(
      `SELECT utb.*, t.name as tag_name 
       FROM user_tag_badges utb
       JOIN tags t ON utb.tag_id = t.id
       WHERE utb.user_id = ?
       ORDER BY 
         CASE utb.badge_tier 
           WHEN 'gold' THEN 3 
           WHEN 'silver' THEN 2 
           WHEN 'bronze' THEN 1 
         END DESC,
         utb.earned_at DESC`,
      [userId]
    );

    return result.rows.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      tagId: row.tag_id,
      tagName: row.tag_name,
      badgeTier: row.badge_tier,
      earnedAt: new Date(row.earned_at),
      isActive: row.is_active,
      lastFreshnessCheck: row.last_freshness_check ? new Date(row.last_freshness_check) : null,
      freshnessScoreSinceCheck: row.freshness_score_since_check,
      markedInactiveAt: row.marked_inactive_at ? new Date(row.marked_inactive_at) : null,
    }));
  } catch (error) {
    console.error('Error getting user tag badges:', error);
    return [];
  }
}

/**
 * Check and update freshness for all gold badges
 * Should be run periodically (e.g., daily cron job)
 */
export async function checkBadgeFreshness(): Promise<void> {
  try {
    const config = await getTagBadgeConfig();
    const goldConfig = config.gold;

    if (!goldConfig.requiresFreshness) {
      return;
    }

    const monthsAgo = new Date();
    monthsAgo.setMonth(monthsAgo.getMonth() - goldConfig.freshnessPeriodMonths);

    // Find gold badges that need freshness check
    const badgesToCheck = await query(
      `SELECT * FROM user_tag_badges 
       WHERE badge_tier = 'gold' 
         AND is_active = TRUE
         AND (last_freshness_check IS NULL OR last_freshness_check < ?)`,
      [monthsAgo]
    );

    for (const badge of badgesToCheck.rows) {
      const checkDate = badge.last_freshness_check || badge.earned_at;
      
      // Calculate points earned in the last X months
      const activityResult = await query(
        `SELECT COALESCE(SUM(points_earned), 0) as points 
         FROM tag_badge_activity 
         WHERE user_id = ? 
           AND tag_id = ? 
           AND created_at >= ?`,
        [badge.user_id, badge.tag_id, checkDate]
      );

      const pointsEarned = activityResult.rows[0]?.points || 0;

      if (pointsEarned < goldConfig.freshnessPointsRequired) {
        // Mark badge as inactive
        await query(
          `UPDATE user_tag_badges 
           SET is_active = FALSE, 
               marked_inactive_at = NOW(),
               last_freshness_check = NOW()
           WHERE id = ?`,
          [badge.id]
        );
        
        console.log(`Marked gold badge ${badge.id} as inactive due to lack of activity`);
      } else {
        // Reset freshness tracking
        await query(
          `UPDATE user_tag_badges 
           SET last_freshness_check = NOW(),
               freshness_score_since_check = 0
           WHERE id = ?`,
          [badge.id]
        );
      }
    }
  } catch (error) {
    console.error('Error checking badge freshness:', error);
  }
}

/**
 * Reactivate a gold badge if user has earned enough points
 */
export async function reactivateInactiveBadge(
  userId: number,
  tagId: number
): Promise<boolean> {
  try {
    const config = await getTagBadgeConfig();
    const goldConfig = config.gold;

    // Find inactive gold badge
    const badgeResult = await query(
      `SELECT * FROM user_tag_badges 
       WHERE user_id = ? 
         AND tag_id = ? 
         AND badge_tier = 'gold' 
         AND is_active = FALSE`,
      [userId, tagId]
    );

    if (badgeResult.rows.length === 0) {
      return false;
    }

    const badge = badgeResult.rows[0];
    const inactiveDate = badge.marked_inactive_at || badge.last_freshness_check;

    // Check activity since becoming inactive
    const activityResult = await query(
      `SELECT COALESCE(SUM(points_earned), 0) as points 
       FROM tag_badge_activity 
       WHERE user_id = ? 
         AND tag_id = ? 
         AND created_at >= ?`,
      [userId, tagId, inactiveDate]
    );

    const pointsEarned = activityResult.rows[0]?.points || 0;

    if (pointsEarned >= goldConfig.freshnessPointsRequired) {
      // Reactivate badge
      await query(
        `UPDATE user_tag_badges 
         SET is_active = TRUE, 
             marked_inactive_at = NULL,
             last_freshness_check = NOW(),
             freshness_score_since_check = 0
         WHERE id = ?`,
        [badge.id]
      );

      console.log(`Reactivated gold badge ${badge.id} for user ${userId}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error reactivating badge:', error);
    return false;
  }
}

/**
 * Get top badge holders for a specific tag
 */
export async function getTopBadgeHolders(
  tagId: number,
  tier?: TagBadgeTier,
  limit: number = 10
): Promise<any[]> {
  try {
    let sql = `
      SELECT 
        u.id,
        u.username,
        u.display_name,
        u.reputation,
        utb.badge_tier,
        utb.is_active,
        utb.earned_at,
        uts.total_score,
        uts.accepted_answers_count
      FROM user_tag_badges utb
      JOIN users u ON utb.user_id = u.id
      JOIN user_tag_scores uts ON utb.user_id = uts.user_id AND utb.tag_id = uts.tag_id
      WHERE utb.tag_id = ?
    `;
    
    const params: any[] = [tagId];

    if (tier) {
      sql += ` AND utb.badge_tier = ?`;
      params.push(tier);
    }

    sql += `
      ORDER BY 
        CASE utb.badge_tier 
          WHEN 'gold' THEN 3 
          WHEN 'silver' THEN 2 
          WHEN 'bronze' THEN 1 
        END DESC,
        uts.total_score DESC
      LIMIT ?
    `;
    params.push(limit);

    const result = await query(sql, params);
    return result.rows;
  } catch (error) {
    console.error('Error getting top badge holders:', error);
    return [];
  }
}

/**
 * Get user's tag statistics
 */
export async function getUserTagStats(userId: number, tagId: number): Promise<UserTagScore | null> {
  try {
    const result = await query(
      `SELECT * FROM user_tag_scores 
       WHERE user_id = ? AND tag_id = ?`,
      [userId, tagId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      userId: row.user_id,
      tagId: row.tag_id,
      totalScore: row.total_score,
      acceptedAnswersCount: row.accepted_answers_count,
      lastActivityAt: new Date(row.last_activity_at),
    };
  } catch (error) {
    console.error('Error getting user tag stats:', error);
    return null;
  }
}
