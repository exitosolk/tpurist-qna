import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { checkUserTagBadge } from "@/lib/tag-badges";
import { createNotification } from "@/lib/notifications";

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
    const questionId = parseInt(id);
    const { action, reason, duplicateOf } = await req.json();

    // Validate action
    if (!['duplicate', 'spam', 'off-topic'].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'duplicate', 'spam', or 'off-topic'" },
        { status: 400 }
      );
    }

    if (action === 'duplicate' && !duplicateOf) {
      return NextResponse.json(
        { error: "duplicateOf question ID is required for duplicate marking" },
        { status: 400 }
      );
    }

    // Get user ID
    const userResult = await query(
      "SELECT id, username FROM users WHERE email = ?",
      [session.user.email]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const userId = userResult.rows[0].id;
    const username = userResult.rows[0].username;

    // Get question and its tags
    const questionResult = await query(
      `SELECT q.id, q.user_id, q.title, q.is_closed, q.closed_reason,
        GROUP_CONCAT(qt.tag_id) as tag_ids
       FROM questions q
       LEFT JOIN question_tags qt ON q.id = qt.question_id
       WHERE q.id = ?
       GROUP BY q.id, q.user_id, q.title, q.is_closed, q.closed_reason`,
      [questionId]
    );

    if (questionResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    const question = questionResult.rows[0];

    if (question.is_closed) {
      return NextResponse.json(
        { error: "Question is already closed" },
        { status: 400 }
      );
    }

    // Check if user has Gold badge in any of the question's tags
    const tagIds = question.tag_ids ? question.tag_ids.split(',').map((id: string) => parseInt(id)) : [];
    
    let hasHammerPrivilege = false;
    for (const tagId of tagIds) {
      const badgeCheck = await checkUserTagBadge(userId, tagId, 'gold');
      if (badgeCheck.canHammer) {
        hasHammerPrivilege = true;
        break;
      }
    }

    if (!hasHammerPrivilege) {
      return NextResponse.json(
        { 
          error: "You need an active Gold badge in one of this question's tags to use the hammer",
          privilege_required: true,
          required_badge: "gold"
        },
        { status: 403 }
      );
    }

    // Validate duplicate target if applicable
    if (action === 'duplicate') {
      const duplicateResult = await query(
        "SELECT id, title FROM questions WHERE id = ?",
        [duplicateOf]
      );

      if (duplicateResult.rows.length === 0) {
        return NextResponse.json(
          { error: "Duplicate target question not found" },
          { status: 404 }
        );
      }
    }

    // Close the question
    const closedReason = action === 'duplicate' 
      ? `Duplicate of question #${duplicateOf}` 
      : action === 'spam'
      ? 'Spam or offensive content'
      : 'Off-topic or not relevant to the community';

    await query(
      `UPDATE questions 
       SET is_closed = TRUE, 
           closed_at = NOW(), 
           closed_by = ?,
           closed_reason = ?
       WHERE id = ?`,
      [userId, closedReason, questionId]
    );

    // If duplicate, create the duplicate link
    if (action === 'duplicate') {
      await query(
        `INSERT INTO question_duplicates (question_id, duplicate_of, marked_by, marked_at)
         VALUES (?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE duplicate_of = ?, marked_by = ?, marked_at = NOW()`,
        [questionId, duplicateOf, userId, duplicateOf, userId]
      );
    }

    // Create close vote record (single vote from gold badge holder)
    await query(
      `INSERT INTO close_votes (question_id, user_id, vote_type, reason, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [questionId, userId, action, reason || closedReason]
    );

    // Log the hammer action
    await query(
      `INSERT INTO moderation_log (user_id, action_type, target_type, target_id, reason, metadata)
       VALUES (?, 'hammer_close', 'question', ?, ?, ?)`,
      [userId, questionId, closedReason, JSON.stringify({ action, duplicateOf, goldBadgeUsed: true })]
    );

    // Notify question owner
    if (question.user_id !== userId) {
      await createNotification({
        userId: question.user_id,
        type: 'question_closed',
        actorId: userId,
        message: `closed your question "${question.title}" as ${action}`,
        questionId: questionId,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Question closed as ${action} using Gold badge hammer`,
      closed_reason: closedReason
    });
  } catch (error) {
    console.error("Error using hammer:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
