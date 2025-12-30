import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface UserRow extends RowDataPacket {
  reputation: number;
}

interface ReviewQueueItem extends RowDataPacket {
  id: number;
  content_type: string;
  content_id: number;
  review_type: string;
  flagged_by: number;
  flagged_at: Date;
  hide_votes: number;
  keep_votes: number;
  flagger_username: string;
  content_preview: string;
  author_username: string;
  user_vote?: string | null;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reviewType = searchParams.get('reviewType') || 'spam_scam';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 20;
    const offset = (page - 1) * limit;

    const userId = parseInt(session.user.id);
    const connection = await pool.getConnection();

    try {
      // Get user's reputation
      const [userRows] = await connection.query<UserRow[]>(
        'SELECT reputation FROM users WHERE id = ?',
        [userId]
      );

      if (userRows.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const userReputation = userRows[0].reputation;

      // Check if user has enough reputation for this review type
      const minReputation = reviewType === 'spam_scam' ? 100 : 500;

      if (userReputation < minReputation) {
        return NextResponse.json(
          { 
            error: `You need ${minReputation} reputation to access this review queue`,
            currentReputation: userReputation,
            requiredReputation: minReputation
          },
          { status: 403 }
        );
      }

      // Fetch review queue items
      const [items] = await connection.query<ReviewQueueItem[]>(
        `SELECT 
          rq.id,
          rq.content_type,
          rq.content_id,
          rq.review_type,
          rq.flagged_by,
          rq.flagged_at,
          rq.hide_votes,
          rq.keep_votes,
          flagger.username as flagger_username,
          rv.vote as user_vote,
          CASE 
            WHEN rq.content_type = 'question' THEN q.title
            WHEN rq.content_type = 'answer' THEN SUBSTRING(a.body, 1, 200)
            WHEN rq.content_type = 'comment' THEN c.text
          END as content_preview,
          CASE 
            WHEN rq.content_type = 'question' THEN qu.username
            WHEN rq.content_type = 'answer' THEN au.username
            WHEN rq.content_type = 'comment' THEN cu.username
          END as author_username
         FROM review_queue rq
         JOIN users flagger ON rq.flagged_by = flagger.id
         LEFT JOIN review_votes rv ON rq.id = rv.review_queue_id AND rv.user_id = ?
         LEFT JOIN questions q ON rq.content_type = 'question' AND rq.content_id = q.id
         LEFT JOIN users qu ON q.user_id = qu.id
         LEFT JOIN answers a ON rq.content_type = 'answer' AND rq.content_id = a.id
         LEFT JOIN users au ON a.user_id = au.id
         LEFT JOIN comments c ON rq.content_type = 'comment' AND rq.content_id = c.id
         LEFT JOIN users cu ON c.user_id = cu.id
         WHERE rq.review_type = ? AND rq.status = 'pending'
         ORDER BY rq.flagged_at ASC
         LIMIT ? OFFSET ?`,
        [userId, reviewType, limit, offset]
      );

      // Get total count
      const [countRows] = await connection.query<RowDataPacket[]>(
        `SELECT COUNT(*) as total FROM review_queue 
         WHERE review_type = ? AND status = 'pending'`,
        [reviewType]
      );

      const total = countRows[0].total;

      // Get user's daily review count for this queue type
      const [dailyCountRows] = await connection.query<RowDataPacket[]>(
        `SELECT COUNT(DISTINCT rv.review_queue_id) as review_count
         FROM review_votes rv
         JOIN review_queue rq ON rv.review_queue_id = rq.id
         WHERE rv.user_id = ? 
           AND rq.review_type = ?
           AND DATE(rv.voted_at) = CURDATE()`,
        [userId, reviewType]
      );

      const reviewedToday = dailyCountRows[0]?.review_count || 0;
      const DAILY_LIMIT = 20;

      connection.release();

      return NextResponse.json({
        success: true,
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        userReputation,
        minReputation,
        reviewLimit: {
          dailyLimit: DAILY_LIMIT,
          reviewedToday,
          remaining: Math.max(0, DAILY_LIMIT - reviewedToday)
        }
      });

    } catch (error) {
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error('Error fetching review queue:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
