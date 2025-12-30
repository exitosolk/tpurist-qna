import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface UserRow extends RowDataPacket {
  reputation: number;
}

interface CountRow extends RowDataPacket {
  spam_scam_count: number;
  outdated_count: number;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

      // Get counts for each queue type
      const [counts] = await connection.query<CountRow[]>(
        `SELECT 
          SUM(CASE WHEN review_type = 'spam_scam' THEN 1 ELSE 0 END) as spam_scam_count,
          SUM(CASE WHEN review_type = 'outdated' THEN 1 ELSE 0 END) as outdated_count
         FROM review_queue 
         WHERE status = 'pending'`
      );

      connection.release();

      return NextResponse.json({
        success: true,
        userReputation,
        canAccessSpamQueue: userReputation >= 100,
        canAccessOutdatedQueue: userReputation >= 500,
        spamScamCount: counts[0]?.spam_scam_count || 0,
        outdatedCount: counts[0]?.outdated_count || 0,
        totalPending: (counts[0]?.spam_scam_count || 0) + (counts[0]?.outdated_count || 0)
      });

    } catch (error) {
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error('Error fetching review stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
