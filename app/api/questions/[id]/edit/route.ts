import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, body, tags, editReason } = await request.json();
    const { id } = await params;
    const questionId = parseInt(id);

    // Get current user
    const userResult = await query(
      "SELECT id, reputation, email_verified FROM users WHERE email = ?",
      [session.user.email]
    );
    const currentUser = userResult.rows[0];

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get the question
    const questionResult = await query(
      "SELECT q.*, u.username FROM questions q JOIN users u ON q.user_id = u.id WHERE q.id = ?",
      [questionId]
    );
    const question = questionResult.rows[0];

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    // Permission check
    const isAuthor = question.user_id === currentUser.id;
    const isHighRep = currentUser.reputation >= 500 && currentUser.email_verified;
    const isModerator = false; // TODO: Add moderator role check

    // Authors can edit everything
    // High-rep users can only edit title and tags
    // Moderators can edit everything
    if (!isAuthor && !isHighRep && !isModerator) {
      return NextResponse.json(
        { error: "Insufficient permissions to edit" },
        { status: 403 }
      );
    }

    // If not author or moderator, only allow title and tag edits
    let finalTitle = title || question.title;
    let finalBody = body || question.body;
    let finalTags = tags || (question.tags ? question.tags.split(',') : []);

    if (!isAuthor && !isModerator && isHighRep) {
      // High-rep users can only edit title and tags
      finalBody = question.body; // Keep original body
    }

    // Check for contact details in edits (for low-rep users, including authors)
    if (currentUser.reputation < 500) {
      // More comprehensive phone number regex (with or without spaces/dashes)
      const phoneRegex = /(\+94|0)\s?\d{2,3}[\s\-]?\d{3,4}[\s\-]?\d{3,4}/g;
      const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/g;
      const whatsappRegex = /(whatsapp|wa\.me)/gi;

      const hasPhone = phoneRegex.test(finalBody) || phoneRegex.test(finalTitle);
      const hasUrl = urlRegex.test(finalBody) || urlRegex.test(finalTitle);
      const hasWhatsapp = whatsappRegex.test(finalBody) || whatsappRegex.test(finalTitle);

      if (hasPhone || hasUrl || hasWhatsapp) {
        return NextResponse.json(
          {
            error:
              "Contact details (phone numbers, URLs, WhatsApp) are not allowed in posts from users with low reputation. Build your reputation by contributing quality content first.",
          },
          { status: 400 }
        );
      }
    }

    // Check if this is within grace period (5 minutes)
    const questionAge = Date.now() - new Date(question.created_at).getTime();
    const isGracePeriod = isAuthor && questionAge < 5 * 60 * 1000; // 5 minutes

    // Create revision history if outside grace period
    if (!isGracePeriod) {
      await query(
        `INSERT INTO revision_history 
        (content_type, content_id, user_id, title_before, title_after, body_before, body_after, tags_before, tags_after, edit_reason)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          "question",
          questionId,
          currentUser.id,
          question.title,
          finalTitle,
          question.body,
          finalBody,
          question.tags,
          finalTags.join(","),
          editReason || null,
        ]
      );
    }

    // Update the question
    const updateParams: any[] = [finalTitle, finalBody];
    let updateSql = "UPDATE questions SET title = ?, body = ?";

    // Update tags if changed
    if (JSON.stringify(finalTags.sort()) !== JSON.stringify((question.tags || '').split(',').sort())) {
      // Delete old tags
      await query("DELETE FROM question_tags WHERE question_id = ?", [questionId]);

      // Insert new tags
      for (const tagName of finalTags) {
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

        // Link tag to question
        await query(
          "INSERT INTO question_tags (question_id, tag_id) VALUES (?, ?)",
          [questionId, tagId]
        );
      }
    }

    // Update edited_at and edit_count if outside grace period
    if (!isGracePeriod) {
      updateSql += ", edited_at = NOW(), edit_count = edit_count + 1";
    }

    updateSql += " WHERE id = ?";
    updateParams.push(questionId);

    await query(updateSql, updateParams);

    return NextResponse.json({
      success: true,
      isGracePeriod,
      message: "Question updated successfully",
    });
  } catch (error) {
    console.error("Error updating question:", error);
    return NextResponse.json(
      { error: "Failed to update question" },
      { status: 500 }
    );
  }
}
