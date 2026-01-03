import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { checkUserTagBadge } from "@/lib/tag-badges";

export async function PUT(
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
    const { tags, reason } = await req.json();

    if (!tags || !Array.isArray(tags) || tags.length === 0) {
      return NextResponse.json(
        { error: "Tags are required" },
        { status: 400 }
      );
    }

    // Get user ID
    const userResult = await query(
      "SELECT id, reputation FROM users WHERE email = ?",
      [session.user.email]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const userId = userResult.rows[0].id;

    // Get question and current tags
    const questionResult = await query(
      `SELECT q.id, q.user_id, q.title,
        GROUP_CONCAT(t.name) as current_tags
       FROM questions q
       LEFT JOIN question_tags qt ON q.id = qt.question_id
       LEFT JOIN tags t ON qt.tag_id = t.id
       WHERE q.id = ?
       GROUP BY q.id, q.user_id, q.title`,
      [questionId]
    );

    if (questionResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    const question = questionResult.rows[0];
    const isQuestionOwner = question.user_id === userId;

    // If not question owner, check for tag badge privileges
    if (!isQuestionOwner) {
      // User must have Silver or Gold badge in at least one of the new tags
      let hasRetagPrivilege = false;

      for (const tagName of tags) {
        // Get tag ID
        const tagResult = await query(
          "SELECT id FROM tags WHERE name = ?",
          [tagName.trim()]
        );

        if (tagResult.rows.length > 0) {
          const tagId = tagResult.rows[0].id;
          const badgeCheck = await checkUserTagBadge(userId, tagId);
          
          if (badgeCheck.canRetag) {
            hasRetagPrivilege = true;
            break;
          }
        }
      }

      if (!hasRetagPrivilege) {
        return NextResponse.json(
          { 
            error: "You need a Silver or Gold badge in one of these tags to retag this question",
            privilege_required: true
          },
          { status: 403 }
        );
      }
    }

    // Delete old tags
    await query(
      "DELETE FROM question_tags WHERE question_id = ?",
      [questionId]
    );

    // Insert new tags
    const tagIds: number[] = [];
    for (const tagName of tags) {
      if (!tagName.trim()) continue;

      // Get or create tag
      const tagResult = await query(
        "SELECT id FROM tags WHERE name = ?",
        [tagName.trim()]
      );

      let tagId;
      if (tagResult.rows.length > 0) {
        tagId = tagResult.rows[0].id;
      } else {
        const insertResult = await query(
          "INSERT INTO tags (name) VALUES (?)",
          [tagName.trim()]
        );
        tagId = insertResult.insertId;
      }

      tagIds.push(tagId);

      // Link tag to question
      await query(
        "INSERT INTO question_tags (question_id, tag_id) VALUES (?, ?)",
        [questionId, tagId]
      );
    }

    // Create revision history for retag
    const currentTags = question.current_tags || '';
    const newTags = tags.join(',');

    await query(
      `INSERT INTO revision_history 
        (content_type, content_id, user_id, title_before, title_after, 
         body_before, body_after, tags_before, tags_after, edit_reason)
       VALUES ('question', ?, ?, ?, ?, '', '', ?, ?, ?)`,
      [
        questionId,
        userId,
        question.title,
        question.title,
        currentTags,
        newTags,
        reason || 'Retagged by tag badge holder'
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Question retagged successfully",
      tags: tags
    });
  } catch (error) {
    console.error("Error retagging question:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
