import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader, PoolConnection } from 'mysql2/promise';

interface UserRow extends RowDataPacket {
  reputation: number;
}

interface ReviewThreshold extends RowDataPacket {
  min_reputation: number;
  votes_needed: number;
}

interface ExistingFlag extends RowDataPacket {
  id: number;
  status: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { contentType, contentId, reviewType, reason } = await request.json();

    // Validate inputs
    if (!contentType || !contentId || !reviewType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['question', 'answer', 'comment'].includes(contentType)) {
      return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
    }

    if (!['spam_scam', 'outdated'].includes(reviewType)) {
      return NextResponse.json({ error: 'Invalid review type' }, { status: 400 });
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

      // Get minimum reputation required for this review type
      const [thresholdRows] = await connection.query<ReviewThreshold[]>(
        'SELECT min_reputation, votes_needed FROM review_thresholds WHERE review_type = ?',
        [reviewType]
      );

      if (thresholdRows.length === 0) {
        return NextResponse.json({ error: 'Review type not configured' }, { status: 500 });
      }

      const minReputation = thresholdRows[0].min_reputation;

      if (userReputation < minReputation) {
        return NextResponse.json(
          { error: `You need ${minReputation} reputation to flag content for ${reviewType}` },
          { status: 403 }
        );
      }

      // Check if content exists
      let contentExists = false;
      if (contentType === 'question') {
        const [questionRows] = await connection.query<RowDataPacket[]>(
          'SELECT id FROM questions WHERE id = ?',
          [contentId]
        );
        contentExists = questionRows.length > 0;
      } else if (contentType === 'answer') {
        const [answerRows] = await connection.query<RowDataPacket[]>(
          'SELECT id FROM answers WHERE id = ?',
          [contentId]
        );
        contentExists = answerRows.length > 0;
      } else if (contentType === 'comment') {
        const [commentRows] = await connection.query<RowDataPacket[]>(
          'SELECT id FROM comments WHERE id = ?',
          [contentId]
        );
        contentExists = commentRows.length > 0;
      }

      if (!contentExists) {
        return NextResponse.json({ error: 'Content not found' }, { status: 404 });
      }

      // Check if this content is already flagged by this user for the same review type
      const [existingFlags] = await connection.query<ExistingFlag[]>(
        `SELECT id, status FROM review_queue 
         WHERE content_type = ? AND content_id = ? AND review_type = ? AND flagged_by = ?`,
        [contentType, contentId, reviewType, userId]
      );

      if (existingFlags.length > 0 && existingFlags[0].status === 'pending') {
        return NextResponse.json(
          { error: 'You have already flagged this content for review' },
          { status: 400 }
        );
      }

      // Check if there's already a pending review for this content and type
      const [pendingReviews] = await connection.query<ExistingFlag[]>(
        `SELECT id FROM review_queue 
         WHERE content_type = ? AND content_id = ? AND review_type = ? AND status = 'pending'`,
        [contentType, contentId, reviewType]
      );

      let reviewQueueId: number;

      if (pendingReviews.length > 0) {
        // Add vote to existing review
        reviewQueueId = pendingReviews[0].id;
      } else {
        // Create new review queue entry
        const [result] = await connection.query<ResultSetHeader>(
          `INSERT INTO review_queue (content_type, content_id, review_type, flagged_by, status) 
           VALUES (?, ?, ?, ?, 'pending')`,
          [contentType, contentId, reviewType, userId]
        );
        reviewQueueId = result.insertId;
      }

      // Automatically add the flagger's vote
      const flagVote = reviewType === 'spam_scam' ? 'hide' : 'outdated';
      await connection.query(
        `INSERT INTO review_votes (review_queue_id, user_id, vote) 
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE vote = VALUES(vote)`,
        [reviewQueueId, userId, flagVote]
      );

      // Update vote counts
      await updateVoteCounts(connection, reviewQueueId);

      // Check if threshold is met and take action
      await checkAndApplyReview(connection, reviewQueueId, thresholdRows[0].votes_needed);

      connection.release();

      return NextResponse.json({
        success: true,
        message: 'Content flagged for review',
        reviewQueueId
      });

    } catch (error) {
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error('Error flagging content:', error);
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

    // Award reputation to voters who voted to hide/outdated
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

    // Award reputation to voters who voted to keep/current
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
