import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader, PoolConnection } from 'mysql2/promise';

interface UserRow extends RowDataPacket {
  reputation: number;
}

interface ReviewRow extends RowDataPacket {
  review_type: string;
  content_type: string;
  content_id: number;
  hide_votes: number;
  keep_votes: number;
  status: string;
}

interface ReviewThreshold extends RowDataPacket {
  min_reputation: number;
  votes_needed: number;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reviewQueueId, vote } = await request.json();

    // Validate inputs
    if (!reviewQueueId || !vote) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['hide', 'keep', 'outdated', 'current'].includes(vote)) {
      return NextResponse.json({ error: 'Invalid vote type' }, { status: 400 });
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

      // Get review queue item
      const [reviewRows] = await connection.query<ReviewRow[]>(
        `SELECT review_type, content_type, content_id, hide_votes, keep_votes, status 
         FROM review_queue WHERE id = ?`,
        [reviewQueueId]
      );

      if (reviewRows.length === 0) {
        return NextResponse.json({ error: 'Review item not found' }, { status: 404 });
      }

      const review = reviewRows[0];

      if (review.status !== 'pending') {
        return NextResponse.json({ error: 'This review has already been completed' }, { status: 400 });
      }

      // Check daily review limit (20 reviews per queue type per day)
      const [dailyCountRows] = await connection.query<RowDataPacket[]>(
        `SELECT COUNT(DISTINCT rv.review_queue_id) as review_count
         FROM review_votes rv
         JOIN review_queue rq ON rv.review_queue_id = rq.id
         WHERE rv.user_id = ? 
           AND rq.review_type = ?
           AND DATE(rv.voted_at) = CURDATE()`,
        [userId, review.review_type]
      );

      const dailyReviewCount = dailyCountRows[0]?.review_count || 0;
      const DAILY_LIMIT = 20;

      // Check if user has already voted on this specific item
      const [existingVoteRows] = await connection.query<RowDataPacket[]>(
        'SELECT id FROM review_votes WHERE review_queue_id = ? AND user_id = ?',
        [reviewQueueId, userId]
      );

      const hasVotedOnThisItem = existingVoteRows.length > 0;

      // Only count against limit if this is a new review (user hasn't voted on this item yet)
      if (!hasVotedOnThisItem && dailyReviewCount >= DAILY_LIMIT) {
        return NextResponse.json({ 
          error: `Daily review limit reached. You can review up to ${DAILY_LIMIT} items per day in this queue. Come back tomorrow!`,
          dailyLimit: DAILY_LIMIT,
          reviewedToday: dailyReviewCount
        }, { status: 429 });
      }

      // Get minimum reputation required for this review type
      const [thresholdRows] = await connection.query<ReviewThreshold[]>(
        'SELECT min_reputation, votes_needed FROM review_thresholds WHERE review_type = ?',
        [review.review_type]
      );

      if (thresholdRows.length === 0) {
        return NextResponse.json({ error: 'Review type not configured' }, { status: 500 });
      }

      const minReputation = thresholdRows[0].min_reputation;

      if (userReputation < minReputation) {
        return NextResponse.json(
          { error: `You need ${minReputation} reputation to review this content` },
          { status: 403 }
        );
      }

      // Validate vote matches review type
      if (review.review_type === 'spam_scam' && !['hide', 'keep'].includes(vote)) {
        return NextResponse.json(
          { error: 'Invalid vote for spam/scam review. Use "hide" or "keep".' },
          { status: 400 }
        );
      }

      if (review.review_type === 'outdated' && !['outdated', 'current'].includes(vote)) {
        return NextResponse.json(
          { error: 'Invalid vote for outdated review. Use "outdated" or "current".' },
          { status: 400 }
        );
      }

      // Record the vote (upsert)
      await connection.query(
        `INSERT INTO review_votes (review_queue_id, user_id, vote) 
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE vote = VALUES(vote), voted_at = CURRENT_TIMESTAMP`,
        [reviewQueueId, userId, vote]
      );

      // Update vote counts
      await updateVoteCounts(connection, reviewQueueId);

      // Award 1 point for completing a review
      await connection.query(
        `INSERT INTO reputation_history (user_id, points, reason, reference_type, reference_id)
         VALUES (?, 1, 'Completed a review task', 'review', ?)`,
        [userId, reviewQueueId]
      );

      await connection.query(
        'UPDATE users SET reputation = reputation + 1 WHERE id = ?',
        [userId]
      );

      // Check if threshold is met and take action
      await checkAndApplyReview(connection, reviewQueueId, thresholdRows[0].votes_needed);

      connection.release();

      return NextResponse.json({
        success: true,
        message: 'Vote recorded successfully'
      });

    } catch (error) {
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error('Error recording review vote:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to update vote counts
async function updateVoteCounts(connection: PoolConnection, reviewQueueId: number) {
  const [votes] = await connection.query<RowDataPacket[]>(
    `SELECT vote, COUNT(*) as count FROM review_votes 
     WHERE review_queue_id = ? GROUP BY vote`,
    [reviewQueueId]
  );

  let hideVotes = 0;
  let keepVotes = 0;

  for (const vote of votes) {
    if (vote.vote === 'hide' || vote.vote === 'outdated') {
      hideVotes += vote.count;
    } else if (vote.vote === 'keep' || vote.vote === 'current') {
      keepVotes += vote.count;
    }
  }

  await connection.query(
    'UPDATE review_queue SET hide_votes = ?, keep_votes = ? WHERE id = ?',
    [hideVotes, keepVotes, reviewQueueId]
  );
}

// Helper function to check thresholds and apply review action
async function checkAndApplyReview(connection: PoolConnection, reviewQueueId: number, votesNeeded: number) {
  const [reviewRows] = await connection.query<RowDataPacket[]>(
    `SELECT content_type, content_id, review_type, hide_votes, keep_votes, status 
     FROM review_queue WHERE id = ?`,
    [reviewQueueId]
  );

  if (reviewRows.length === 0 || reviewRows[0].status !== 'pending') {
    return;
  }

  const review = reviewRows[0];
  const totalVotes = review.hide_votes + review.keep_votes;

  if (totalVotes < votesNeeded) {
    return; // Not enough votes yet
  }

  // Determine action based on majority vote
  if (review.hide_votes > review.keep_votes) {
    // Apply the flag
    const flagType = review.review_type === 'spam_scam' ? 'hidden_spam' : 'outdated';
    
    await connection.query(
      `INSERT INTO content_flags (content_type, content_id, flag_type, review_queue_id, is_active) 
       VALUES (?, ?, ?, ?, TRUE)
       ON DUPLICATE KEY UPDATE is_active = TRUE, review_queue_id = VALUES(review_queue_id)`,
      [review.content_type, review.content_id, flagType, reviewQueueId]
    );

    // Update review status
    await connection.query(
      `UPDATE review_queue SET status = 'approved', resolution_at = NOW() WHERE id = ?`,
      [reviewQueueId]
    );

    // Award reputation to voters who voted to hide/outdated (consensus bonus)
    await connection.query(
      `INSERT INTO reputation_history (user_id, points, reason, reference_type, reference_id)
       SELECT rv.user_id, 2, 'Review vote agreed with community consensus', 'review', rv.id
       FROM review_votes rv
       WHERE rv.review_queue_id = ? AND rv.vote IN ('hide', 'outdated')`,
      [reviewQueueId]
    );

    // Update user reputation
    await connection.query(
      `UPDATE users u
       JOIN review_votes rv ON rv.user_id = u.id
       SET u.reputation = u.reputation + 2
       WHERE rv.review_queue_id = ? AND rv.vote IN ('hide', 'outdated')`,
      [reviewQueueId]
    );

  } else {
    // Keep the content - reject the review
    await connection.query(
      `UPDATE review_queue SET status = 'rejected', resolution_at = NOW() WHERE id = ?`,
      [reviewQueueId]
    );

    // Award reputation to voters who voted to keep/current (consensus bonus)
    await connection.query(
      `INSERT INTO reputation_history (user_id, points, reason, reference_type, reference_id)
       SELECT rv.user_id, 2, 'Review vote agreed with community consensus', 'review', rv.id
       FROM review_votes rv
       WHERE rv.review_queue_id = ? AND rv.vote IN ('keep', 'current')`,
      [reviewQueueId]
    );

    // Update user reputation
    await connection.query(
      `UPDATE users u
       JOIN review_votes rv ON rv.user_id = u.id
       SET u.reputation = u.reputation + 2
       WHERE rv.review_queue_id = ? AND rv.vote IN ('keep', 'current')`,
      [reviewQueueId]
    );
  }
}
