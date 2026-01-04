import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';

/**
 * GET /api/badges
 * Fetch all badges earned by the current user with progress data
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);
    const connection = await pool.getConnection();

    try {
      // Get all earned badges
      const [earnedBadges] = await connection.query<any[]>(
        `SELECT 
          b.id,
          b.name,
          b.tier,
          b.description,
          b.icon,
          ub.awarded_at
         FROM user_badges ub
         INNER JOIN badges b ON ub.badge_id = b.id
         WHERE ub.user_id = ?
         ORDER BY ub.awarded_at DESC`,
        [userId]
      );

      // Get badge progress (for badges not yet earned)
      const [progressData] = await connection.query<any[]>(
        `SELECT 
          b.id,
          b.name,
          b.tier,
          b.description,
          b.icon,
          bp.progress,
          bp.target
         FROM badge_progress bp
         INNER JOIN badges b ON bp.badge_id = b.id
         LEFT JOIN user_badges ub ON ub.user_id = bp.user_id AND ub.badge_id = bp.badge_id
         WHERE bp.user_id = ? AND ub.id IS NULL
         ORDER BY b.tier, b.name`,
        [userId]
      );

      // Get all bronze tier badges for comparison
      const [allBronzeBadges] = await connection.query<any[]>(
        `SELECT id, name, tier, description, icon
         FROM badges
         WHERE tier = 'bronze'
         ORDER BY id`
      );

      // Get tag-based badges
      const [tagBadges] = await connection.query<any[]>(
        `SELECT 
          utb.id,
          utb.badge_tier as tier,
          utb.is_active as isActive,
          utb.earned_at as earnedAt,
          utb.marked_inactive_at as markedInactiveAt,
          t.name as tagName,
          uts.total_score as score,
          uts.accepted_answers_count as acceptedAnswers,
          uts.last_activity_at as lastActivity
         FROM user_tag_badges utb
         INNER JOIN tags t ON utb.tag_id = t.id
         INNER JOIN user_tag_scores uts ON utb.user_id = uts.user_id AND utb.tag_id = uts.tag_id
         WHERE utb.user_id = ?
         ORDER BY 
           CASE utb.badge_tier 
             WHEN 'gold' THEN 1 
             WHEN 'silver' THEN 2 
             WHEN 'bronze' THEN 3 
           END,
           utb.is_active DESC,
           utb.earned_at DESC`,
        [userId]
      );

      return NextResponse.json({
        earned: earnedBadges,
        progress: progressData,
        availableBronze: allBronzeBadges,
        tagBadges: tagBadges
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching badges:', error);
    return NextResponse.json(
      { error: 'Failed to fetch badges' },
      { status: 500 }
    );
  }
}
