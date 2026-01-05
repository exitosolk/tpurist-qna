import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';
import {
  getClosureConfig,
  getCloseReasons,
  closeQuestion,
  hasGoldBadgeHammer,
  getCloseVoteCounts,
  hasUserVotedToClose,
} from '@/lib/closure';

interface UserRow extends RowDataPacket {
  reputation: number;
}

interface QuestionRow extends RowDataPacket {
  id: number;
  user_id: number;
  is_closed: boolean;
  title: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const questionId = parseInt(params.id);

    if (isNaN(questionId)) {
      return NextResponse.json({ error: 'Invalid question ID' }, { status: 400 });
    }

    // Get available close reasons
    const closeReasons = await getCloseReasons();

    // Get current close vote counts
    const voteCounts = await getCloseVoteCounts(questionId);

    // Get closure configuration
    const config = await getClosureConfig();

    return NextResponse.json({
      closeReasons,
      voteCounts,
      votesNeeded: config.closeVotesNeeded,
      minReputation: config.minReputationClose,
    });
  } catch (error) {
    console.error('Error fetching close vote data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
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
    const { closeReasonKey, details } = await request.json();

    if (isNaN(questionId)) {
      return NextResponse.json({ error: 'Invalid question ID' }, { status: 400 });
    }

    if (!closeReasonKey) {
      return NextResponse.json({ error: 'Close reason is required' }, { status: 400 });
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

      // Check if user has gold badge hammer privilege
      const hasHammer = await hasGoldBadgeHammer(userId, questionId);

      // Check reputation requirement (unless they have hammer)
      if (!hasHammer && userReputation < config.minReputationClose) {
        return NextResponse.json(
          { error: `You need ${config.minReputationClose} reputation to vote to close questions` },
          { status: 403 }
        );
      }

      // Get question details
      const [questionRows] = await connection.query<QuestionRow[]>(
        'SELECT id, user_id, is_closed, title FROM questions WHERE id = ?',
        [questionId]
      );

      if (questionRows.length === 0) {
        return NextResponse.json({ error: 'Question not found' }, { status: 404 });
      }

      const question = questionRows[0];

      if (question.is_closed) {
        return NextResponse.json({ error: 'Question is already closed' }, { status: 400 });
      }

      // Check if user is the question author (can't close own question)
      if (question.user_id === userId) {
        return NextResponse.json(
          { error: 'You cannot vote to close your own question' },
          { status: 403 }
        );
      }

      // Check if user already voted to close this question
      const alreadyVoted = await hasUserVotedToClose(userId, questionId);
      if (alreadyVoted) {
        return NextResponse.json(
          { error: 'You have already voted to close this question' },
          { status: 400 }
        );
      }

      // Validate close reason
      const [closeReasonRows] = await connection.query<RowDataPacket[]>(
        'SELECT id, requires_details FROM close_reasons WHERE reason_key = ? AND is_active = TRUE',
        [closeReasonKey]
      );

      if (closeReasonRows.length === 0) {
        return NextResponse.json({ error: 'Invalid close reason' }, { status: 400 });
      }

      const closeReasonId = closeReasonRows[0].id;
      const requiresDetails = closeReasonRows[0].requires_details;

      if (requiresDetails && !details) {
        return NextResponse.json(
          { error: 'This close reason requires additional details' },
          { status: 400 }
        );
      }

      // If user has gold badge hammer, close immediately
      if (hasHammer) {
        await closeQuestion(
          questionId,
          closeReasonKey,
          details || `Closed by gold badge holder`,
          userId,
          false,
          connection
        );

        connection.release();

        return NextResponse.json({
          success: true,
          message: 'Question closed immediately (gold badge privilege)',
          closed: true,
        });
      }

      // Record close vote
      await connection.query(
        `INSERT INTO question_close_votes (question_id, user_id, close_reason_id, close_details)
         VALUES (?, ?, ?, ?)`,
        [questionId, userId, closeReasonId, details]
      );

      // Count votes for this specific close reason
      const [voteCountRows] = await connection.query<RowDataPacket[]>(
        `SELECT COUNT(DISTINCT user_id) as vote_count
         FROM question_close_votes
         WHERE question_id = ? AND close_reason_id = ? AND is_active = TRUE`,
        [questionId, closeReasonId]
      );

      const voteCount = voteCountRows[0]?.vote_count || 0;

      // Check if threshold is met
      if (voteCount >= config.closeVotesNeeded) {
        // Close the question
        await closeQuestion(
          questionId,
          closeReasonKey,
          details || null,
          userId, // Last voter closes it
          false,
          connection
        );

        // Award reputation to all voters who voted for this reason
        await connection.query(
          `INSERT INTO reputation_history (user_id, points, reason, reference_type, reference_id)
           SELECT user_id, 2, 'Close vote accepted', 'question', ?
           FROM question_close_votes
           WHERE question_id = ? AND close_reason_id = ? AND is_active = TRUE`,
          [questionId, questionId, closeReasonId]
        );

        await connection.query(
          `UPDATE users u
           JOIN question_close_votes qcv ON u.id = qcv.user_id
           SET u.reputation = u.reputation + 2
           WHERE qcv.question_id = ? AND qcv.close_reason_id = ? AND qcv.is_active = TRUE`,
          [questionId, closeReasonId]
        );

        connection.release();

        return NextResponse.json({
          success: true,
          message: 'Question closed successfully',
          closed: true,
          voteCount,
        });
      }

      connection.release();

      return NextResponse.json({
        success: true,
        message: `Close vote recorded (${voteCount}/${config.closeVotesNeeded})`,
        closed: false,
        voteCount,
        votesNeeded: config.closeVotesNeeded,
      });

    } catch (error) {
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error('Error recording close vote:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
