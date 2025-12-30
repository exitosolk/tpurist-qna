import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import {
  checkAyubowanBadge,
  checkFirstLandingBadge,
  updateRiceAndCurryProgress,
  checkSnapshotBadge
} from '@/lib/badges';

/**
 * POST /api/badges/check
 * Check all badges for the current user
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
    const awarded: string[] = [];

    // Check Ayubowan badge
    const ayubowan = await checkAyubowanBadge(userId);
    if (ayubowan.awarded) awarded.push('Ayubowan');

    // Check Rice & Curry badge (10 upvotes)
    const riceAndCurry = await updateRiceAndCurryProgress(userId);
    if (riceAndCurry.awarded) awarded.push('Rice & Curry');

    // Check First Landing badge
    const userQuestions = await query(
      `SELECT id, score, created_at 
       FROM questions 
       WHERE user_id = ? 
       ORDER BY created_at ASC 
       LIMIT 1`,
      [userId]
    );
    if (userQuestions.rows.length > 0) {
      const firstQuestion = userQuestions.rows[0];
      const firstLanding = await checkFirstLandingBadge(userId, firstQuestion.id);
      if (firstLanding.awarded) awarded.push('First Landing');
    }

    // Check Snapshot badge for questions with images
    const questionsWithImages = await query(
      `SELECT id, score, body 
       FROM questions 
       WHERE user_id = ? AND score >= 5`,
      [userId]
    );
    for (const q of questionsWithImages.rows) {
      if (/!\[.*?\]\(.*?\)|<img\s+[^>]*src=/.test(q.body)) {
        const snapshot = await checkSnapshotBadge(userId, 'question', q.id);
        if (snapshot.awarded) {
          awarded.push('Snapshot');
          break;
        }
      }
    }

    // Check Snapshot badge for answers with images (if not already awarded)
    if (!awarded.includes('Snapshot')) {
      const answersWithImages = await query(
        `SELECT id, score, body 
         FROM answers 
         WHERE user_id = ? AND score >= 5`,
        [userId]
      );
      for (const a of answersWithImages.rows) {
        if (/!\[.*?\]\(.*?\)|<img\s+[^>]*src=/.test(a.body)) {
          const snapshot = await checkSnapshotBadge(userId, 'answer', a.id);
          if (snapshot.awarded) {
            awarded.push('Snapshot');
            break;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      checked: ['Ayubowan', 'First Landing', 'Rice & Curry', 'Snapshot'],
      awarded
    });
  } catch (error) {
    console.error('Error checking badges:', error);
    return NextResponse.json(
      { error: 'Failed to check badges' },
      { status: 500 }
    );
  }
}
