import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

/**
 * GET /api/users/[userId]/tag-badges
 * Fetch all tag-based badges earned by a specific user
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = parseInt(params.userId);

    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    const connection = await pool.getConnection();

    try {
      // Get all tag badges for the user
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

      // Get summary counts
      const goldCount = tagBadges.filter(b => b.tier === 'gold' && b.isActive).length;
      const silverCount = tagBadges.filter(b => b.tier === 'silver' && b.isActive).length;
      const bronzeCount = tagBadges.filter(b => b.tier === 'bronze' && b.isActive).length;
      const inactiveCount = tagBadges.filter(b => !b.isActive).length;

      return NextResponse.json({
        badges: tagBadges,
        summary: {
          gold: goldCount,
          silver: silverCount,
          bronze: bronzeCount,
          inactive: inactiveCount,
          total: tagBadges.length
        }
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching user tag badges:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tag badges' },
      { status: 500 }
    );
  }
}
