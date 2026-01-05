import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';
import {
  getClosureConfig,
  reopenQuestion,
  hasUserVotedToReopen,
} from '@/lib/closure';

interface UserRow extends RowDataPacket {
  reputation: number;
}

interface QuestionRow extends RowDataPacket {
  id: number;
  user_id: number;
  is_closed: boolean;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const questionId = parseInt(params.id);
    const { reason } = await request.json();

    if (isNaN(questionId)) {
      return NextResponse.json({ error: 'Invalid question ID' }, { status: 400 });
    }

    const userId = parseInt(session.user.id);
    const connection = await pool.getConnection();

    try {
      // Get closure configuration
      const config = await getClosureConfig();

      // Get user's reputation
      const [userRows] = await connection.query<UserRow[]>(
        'SELECT reputation FROM users WHERE id = ?',
        [userId]
      );

      if (userRows.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const userReputation = userRows[0].reputation;

      // Check reputation requirement
      if (userReputation < config.minReputationReopen) {
        return NextResponse.json(
          { error: `You need ${config.minReputationReopen} reputation to vote to reopen questions` },
          { status: 403 }
        );
      }

      // Get question details
      const [questionRows] = await connection.query<QuestionRow[]>(
        'SELECT id, user_id, is_closed FROM questions WHERE id = ?',
        [questionId]
      );

      if (questionRows.length === 0) {
        return NextResponse.json({ error: 'Question not found' }, { status: 404 });
      }

      const question = questionRows[0];

      if (!question.is_closed) {
        return NextResponse.json({ error: 'Question is not closed' }, { status: 400 });
      }

      // Check if user already voted to reopen this question
      const alreadyVoted = await hasUserVotedToReopen(userId, questionId);
      if (alreadyVoted) {
        return NextResponse.json(
          { error: 'You have already voted to reopen this question' },
          { status: 400 }
        );
      }

      // Record reopen vote
      await connection.query(
        `INSERT INTO question_reopen_votes (question_id, user_id, reason)
         VALUES (?, ?, ?)`,
        [questionId, userId, reason || null]
      );

      // Count reopen votes
      const [voteCountRows] = await connection.query<RowDataPacket[]>(
        `SELECT COUNT(DISTINCT user_id) as vote_count
         FROM question_reopen_votes
         WHERE question_id = ? AND is_active = TRUE`,
        [questionId]
      );

      const voteCount = voteCountRows[0]?.vote_count || 0;

      // Check if threshold is met
      if (voteCount >= config.reopenVotesNeeded) {
        // Reopen the question
        await reopenQuestion(questionId, userId, connection);

        // Award reputation to all reopen voters
        await connection.query(
          `INSERT INTO reputation_history (user_id, points, reason, reference_type, reference_id)
           SELECT user_id, 2, 'Reopen vote successful', 'question', ?
           FROM question_reopen_votes
           WHERE question_id = ? AND is_active = TRUE`,
          [questionId, questionId]
        );

        await connection.query(
          `UPDATE users u
           JOIN question_reopen_votes qrv ON u.id = qrv.user_id
           SET u.reputation = u.reputation + 2
           WHERE qrv.question_id = ? AND qrv.is_active = TRUE`,
          [questionId]
        );

        connection.release();

        return NextResponse.json({
          success: true,
          message: 'Question reopened successfully',
          reopened: true,
          voteCount,
        });
      }

      connection.release();

      return NextResponse.json({
        success: true,
        message: `Reopen vote recorded (${voteCount}/${config.reopenVotesNeeded})`,
        reopened: false,
        voteCount,
        votesNeeded: config.reopenVotesNeeded,
      });

    } catch (error) {
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error('Error recording reopen vote:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Get reopen vote count for a question
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const questionId = parseInt(params.id);

    if (isNaN(questionId)) {
      return NextResponse.json({ error: 'Invalid question ID' }, { status: 400 });
    }

    const connection = await pool.getConnection();

    try {
      // Get reopen vote count
      const [voteCountRows] = await connection.query<RowDataPacket[]>(
        `SELECT COUNT(DISTINCT user_id) as vote_count
         FROM question_reopen_votes
         WHERE question_id = ? AND is_active = TRUE`,
        [questionId]
      );

      const voteCount = voteCountRows[0]?.vote_count || 0;

      // Get configuration
      const config = await getClosureConfig();

      connection.release();

      return NextResponse.json({
        voteCount,
        votesNeeded: config.reopenVotesNeeded,
        minReputation: config.minReputationReopen,
      });

    } catch (error) {
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error('Error fetching reopen vote data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
