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

      return NextResponse.json({
        earned: earnedBadges,
        progress: progressData,
        availableBronze: allBronzeBadges
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
