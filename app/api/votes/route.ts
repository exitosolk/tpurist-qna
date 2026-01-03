import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import { logReputationChange } from "@/lib/reputation";
import { updateRiceAndCurryProgress, checkFirstLandingBadge, checkSnapshotBadge } from "@/lib/badges";
import { checkRateLimit, recordRateLimitAction } from "@/lib/rate-limit";
import { recordQualityStrike } from "@/lib/quality-ban";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { votableType, votableId, voteType } = body;

    if (!["question", "answer"].includes(votableType)) {
      return NextResponse.json(
        { error: "Invalid votable type" },
        { status: 400 }
      );
    }

    if (![1, -1].includes(voteType)) {
      return NextResponse.json(
        { error: "Invalid vote type" },
        { status: 400 }
      );
    }

    // Get user ID and reputation
    const userResult = await query(
      "SELECT id, reputation, email_verified FROM users WHERE email = $1",
      [session.user.email]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check email verification
    if (!userResult.rows[0].email_verified) {
      return NextResponse.json(
        { 
          error: "Please verify your email address before voting",
          verification_required: true 
        },
        { status: 403 }
      );
    }

    const userId = userResult.rows[0].id;
    const voterReputation = userResult.rows[0].reputation || 0;

    // Check rate limit
    const rateLimitCheck = await checkRateLimit(userId, 'vote');
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { 
          error: rateLimitCheck.message,
          rate_limit_exceeded: true,
          limit: rateLimitCheck.limit,
          resetAt: rateLimitCheck.resetAt
        },
        { status: 429 }
      );
    }

    // Check if user is trying to vote on their own content
    const ownerCheckQuery = votableType === "question" 
      ? "SELECT user_id FROM questions WHERE id = ?"
      : "SELECT user_id FROM answers WHERE id = ?";
    
    const ownerResult = await query(ownerCheckQuery, [votableId]);
    
    if (ownerResult.rows.length > 0 && ownerResult.rows[0].user_id === userId) {
      return NextResponse.json(
        { error: "You cannot vote on your own content" },
        { status: 403 }
      );
    }

    const contentOwnerId = ownerResult.rows.length > 0 ? ownerResult.rows[0].user_id : null;

    // Check if user has enough reputation to downvote
    if (voteType === -1 && voterReputation < 125) {
      return NextResponse.json(
        { error: "You need at least 125 reputation points to downvote" },
        { status: 403 }
      );
    }

    // Check if user already voted
    const existingVote = await query(
      `SELECT * FROM votes 
       WHERE user_id = $1 AND votable_type = $2 AND votable_id = $3`,
      [userId, votableType, votableId]
    );

    if (existingVote.rows.length > 0) {
      const currentVote = existingVote.rows[0];
      
      if (currentVote.vote_type === voteType) {
        // Remove vote if clicking same button
        await query(
          `DELETE FROM votes 
           WHERE user_id = $1 AND votable_type = $2 AND votable_id = $3`,
          [userId, votableType, votableId]
        );

        // Update score
        await query(
          `UPDATE ${votableType}s SET score = score - $1 WHERE id = $2`,
          [voteType, votableId]
        );

        // Reverse reputation change for content owner
        if (contentOwnerId) {
          const repChange = votableType === "question" 
            ? (voteType === 1 ? -5 : 2)  // Question: +5 for upvote, -2 for downvote
            : (voteType === 1 ? -10 : 2); // Answer: +10 for upvote, -2 for downvote
          
          await query(
            "UPDATE users SET reputation = GREATEST(0, reputation + ?) WHERE id = ?",
            [repChange, contentOwnerId]
          );

          // Log reputation change
          await logReputationChange({
            userId: contentOwnerId,
            changeAmount: repChange,
            reason: voteType === 1 ? "Upvote removed" : "Downvote removed",
            referenceType: votableType as 'question' | 'answer',
            referenceId: votableId
          });
        }

        return NextResponse.json({ message: "Vote removed" });
      } else {
        // Update vote
        await query(
          `UPDATE votes SET vote_type = $1 
           WHERE user_id = $2 AND votable_type = $3 AND votable_id = $4`,
          [voteType, userId, votableType, votableId]
        );

        // Update score (difference is 2 because we're reversing)
        await query(
          `UPDATE ${votableType}s SET score = score + $1 WHERE id = $2`,
          [voteType * 2, votableId]
        );

        // Update reputation for content owner (reversing old vote and applying new vote)
        if (contentOwnerId) {
          const oldRepChange = votableType === "question" 
            ? (currentVote.vote_type === 1 ? -5 : 2)  // Reverse old vote
            : (currentVote.vote_type === 1 ? -10 : 2);
          
          const newRepChange = votableType === "question" 
            ? (voteType === 1 ? 5 : -2)  // Apply new vote
            : (voteType === 1 ? 10 : -2);
          
          await query(
            "UPDATE users SET reputation = GREATEST(0, reputation + ?) WHERE id = ?",
            [oldRepChange + newRepChange, contentOwnerId]
          );

          // Log reputation change
          await logReputationChange({
            userId: contentOwnerId,
            changeAmount: oldRepChange + newRepChange,
            reason: voteType === 1 ? "Received upvote" : "Received downvote",
            referenceType: votableType as 'question' | 'answer',
            referenceId: votableId
          });

          // Track quality strikes for questions when changing to downvote
          if (votableType === "question" && voteType === -1) {
            await recordQualityStrike(contentOwnerId, votableId, 'downvote');
          }
        }

        return NextResponse.json({ message: "Vote updated" });
      }
    } else {
      // Create new vote
      await query(
        `INSERT INTO votes (user_id, votable_type, votable_id, vote_type) 
         VALUES ($1, $2, $3, $4)`,
        [userId, votableType, votableId, voteType]
      );

      // Update score
      await query(
        `UPDATE ${votableType}s SET score = score + $1 WHERE id = $2`,
        [voteType, votableId]
      );

      // Update reputation for content owner
      if (contentOwnerId) {
        const repChange = votableType === "question" 
          ? (voteType === 1 ? 5 : -2)  // Question: +5 for upvote, -2 for downvote
          : (voteType === 1 ? 10 : -2); // Answer: +10 for upvote, -2 for downvote
        
        await query(
          "UPDATE users SET reputation = GREATEST(0, reputation + ?) WHERE id = ?",
          [repChange, contentOwnerId]
        );
        // Log reputation change
        await logReputationChange({
          userId: contentOwnerId,
          changeAmount: repChange,
          reason: voteType === 1 ? "Received upvote" : "Received downvote",
          referenceType: votableType as 'question' | 'answer',
          referenceId: votableId
        });

        // Track quality strikes for question downvotes
        if (votableType === "question" && voteType === -1) {
          await recordQualityStrike(contentOwnerId, votableId, 'downvote');
        }
        // Create notification for upvotes only (not downvotes to avoid negativity)
        if (voteType === 1) {
          // Get content title/body for message
          let contentTitle = "your content";
          let notificationQuestionId = undefined;
          
          if (votableType === "question") {
            const qResult = await query("SELECT title FROM questions WHERE id = ?", [votableId]);
            if (qResult.rows && qResult.rows.length > 0) {
              contentTitle = `"${qResult.rows[0].title}"`;
            }
            notificationQuestionId = votableId;
          } else if (votableType === "answer") {
            // For answers, get the question info
            const answerResult = await query("SELECT question_id FROM answers WHERE id = ?", [votableId]);
            if (answerResult.rows && answerResult.rows.length > 0) {
              const questionId = answerResult.rows[0].question_id;
              notificationQuestionId = questionId;
              
              // Get question title
              const qResult = await query("SELECT title FROM questions WHERE id = ?", [questionId]);
              if (qResult.rows && qResult.rows.length > 0) {
                contentTitle = `on "${qResult.rows[0].title}"`;
              }
            }
          }

          await createNotification({
            userId: contentOwnerId,
            type: votableType === "question" ? 'question_upvote' : 'answer_upvote',
            actorId: userId,
            message: `upvoted your ${votableType} ${contentTitle}`,
            questionId: notificationQuestionId,
            answerId: votableType === "answer" ? votableId : undefined,
          });
        }

        // Badge checks for upvotes
        if (voteType === 1) {
          // Rice & Curry: Track voter's progress towards 10 upvotes
          await updateRiceAndCurryProgress(userId);

          // First Landing: Check if question author earned their badge
          if (votableType === "question") {
            await checkFirstLandingBadge(contentOwnerId, votableId);
          }

          // Snapshot: Check if content with image got 5 upvotes
          const updatedContent = await query(
            `SELECT score FROM ${votableType}s WHERE id = ?`,
            [votableId]
          );
          if (updatedContent.rows && updatedContent.rows.length > 0 && updatedContent.rows[0].score >= 5) {
            await checkSnapshotBadge(contentOwnerId, votableType as 'question' | 'answer', votableId);
          }
        }
      }

      // Record rate limit action
      await recordRateLimitAction(userId, 'vote');

      return NextResponse.json({ message: "Vote recorded" }, { status: 201 });
    }
  } catch (error) {
    console.error("Error processing vote:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
