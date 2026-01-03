import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import { logReputationChange } from "@/lib/reputation";
import { updateUserTagScore, recordTagActivity } from "@/lib/tag-badges";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const answerId = id;

    // Get user ID
    const userResult = await query(
      "SELECT id FROM users WHERE email = ?",
      [session.user.email]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const userId = userResult.rows[0].id;

    // Get answer and question info
    const answerResult = await query(
      `SELECT a.id, a.question_id, q.user_id as question_owner_id
       FROM answers a
       JOIN questions q ON a.question_id = q.id
       WHERE a.id = ?`,
      [answerId]
    );

    if (answerResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Answer not found" },
        { status: 404 }
      );
    }

    const answer = answerResult.rows[0];

    // Check if user owns the question
    if (answer.question_owner_id !== userId) {
      return NextResponse.json(
        { error: "Only the question owner can accept answers" },
        { status: 403 }
      );
    }

    // Get the answer owner to give reputation points
    const answerOwnerResult = await query(
      "SELECT user_id FROM answers WHERE id = ?",
      [answerId]
    );

    const answerOwnerId = answerOwnerResult.rows[0]?.user_id;

    // Check if there was a previously accepted answer
    const previousAcceptedResult = await query(
      "SELECT id, user_id FROM answers WHERE question_id = ? AND is_accepted = 1",
      [answer.question_id]
    );

    // Remove reputation from previous answer owner if exists
    if (previousAcceptedResult.rows.length > 0) {
      const previousOwnerId = previousAcceptedResult.rows[0].user_id;
      await query(
        "UPDATE users SET reputation = GREATEST(0, reputation - 15) WHERE id = ?",
        [previousOwnerId]
      );

      // Log reputation loss
      await logReputationChange({
        userId: previousOwnerId,
        changeAmount: -15,
        reason: "Answer no longer accepted",
        referenceType: 'accepted_answer',
        referenceId: previousAcceptedResult.rows[0].id
      });
    }

    // Unmark any previously accepted answer for this question
    await query(
      "UPDATE answers SET is_accepted = 0 WHERE question_id = ?",
      [answer.question_id]
    );

    // Mark this answer as accepted
    await query(
      "UPDATE answers SET is_accepted = 1 WHERE id = ?",
      [answerId]
    );

    // Give reputation points to answer owner (+15 for accepted answer)
    if (answerOwnerId) {
      await query(
        "UPDATE users SET reputation = reputation + 15 WHERE id = ?",
        [answerOwnerId]
      );

      // Log reputation gain
      await logReputationChange({
        userId: answerOwnerId,
        changeAmount: 15,
        reason: "Answer accepted",
        referenceType: 'accepted_answer',
        referenceId: parseInt(answerId)
      });

      // Get question title for notification
      const questionResult = await query(
        "SELECT title FROM questions WHERE id = ?",
        [answer.question_id]
      );

      const questionTitle = questionResult.rows[0]?.title;

      // Create notification for answer owner
      await createNotification({
        userId: answerOwnerId,
        type: 'accepted_answer',
        actorId: userId,
        message: `accepted your answer on "${questionTitle}"`,
        questionId: answer.question_id,
        answerId: parseInt(answerId),
      });

      // Tag Badge: Track accepted answer for tag badges
      const questionTagsResult = await query(
        `SELECT tag_id FROM question_tags WHERE question_id = ?`,
        [answer.question_id]
      );

      // Award points and increment accepted answer count for each tag
      for (const tagRow of questionTagsResult.rows) {
        // Accepted answer awards reputation points (already done above) but doesn't add tag score points
        // We only track the accepted answer count
        await updateUserTagScore(answerOwnerId, tagRow.tag_id, 0, true);
        await recordTagActivity(
          answerOwnerId,
          tagRow.tag_id,
          'accepted_answer',
          0, // No additional points, just tracking the acceptance
          answer.question_id,
          parseInt(answerId)
        );
      }
    }

    return NextResponse.json({ message: "Answer accepted successfully" });
  } catch (error) {
    console.error("Error accepting answer:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
