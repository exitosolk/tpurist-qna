import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { checkAyubowanBadge } from '@/lib/badges';

/**
 * POST /api/badges/backfill
 * One-time endpoint to award badges to existing users who qualify
 * Only accessible to authenticated users (checks their own badges)
 */
export async function POST(req: NextRequest) {
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
      const results = {
        ayubowan: false,
      };

      // Check Ayubowan badge for current user
      const ayubowanResult = await checkAyubowanBadge(userId);
      results.ayubowan = ayubowanResult.awarded;

      return NextResponse.json({
        message: 'Badge check complete',
        userId,
        results,
        awarded: Object.values(results).filter(Boolean).length
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error in badge backfill:', error);
    return NextResponse.json(
      { error: 'Failed to check badges' },
      { status: 500 }
    );
  }
}
