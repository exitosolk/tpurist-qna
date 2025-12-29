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

    const { body, editReason } = await request.json();
    const { id } = await params;
    const answerId = parseInt(id);

    // Get current user
    const userResult = await query(
      "SELECT id, reputation, email_verified FROM users WHERE email = ?",
      [session.user.email]
    );
    const currentUser = userResult.rows[0];

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get the answer
    const answerResult = await query(
      "SELECT a.*, u.username FROM answers a JOIN users u ON a.user_id = u.id WHERE a.id = ?",
      [answerId]
    );
    const answer = answerResult.rows[0];

    if (!answer) {
      return NextResponse.json({ error: "Answer not found" }, { status: 404 });
    }

    // Permission check
    const isAuthor = answer.user_id === currentUser.id;
    const isModerator = false; // TODO: Add moderator role check

    // Only authors and moderators can edit answer bodies
    if (!isAuthor && !isModerator) {
      return NextResponse.json(
        { error: "Only the author or moderators can edit answers" },
        { status: 403 }
      );
    }

    // Check for contact details in edits (for low-rep users, including authors)
    if (currentUser.reputation < 500) {
      // More comprehensive phone number regex (with or without spaces/dashes)
      const phoneRegex = /(\+94|0)\s?\d{2,3}[\s\-]?\d{3,4}[\s\-]?\d{3,4}/g;
      const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/g;
      const whatsappRegex = /(whatsapp|wa\.me)/gi;

      if (
        phoneRegex.test(body) ||
        urlRegex.test(body) ||
        whatsappRegex.test(body)
      ) {
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
    const answerAge = Date.now() - new Date(answer.created_at).getTime();
    const isGracePeriod = isAuthor && answerAge < 5 * 60 * 1000; // 5 minutes

    // Warn if post is old (>6 months)
    const isOldPost = answerAge > 6 * 30 * 24 * 60 * 60 * 1000; // 6 months
    let updateWarning = null;
    if (isOldPost && !body.includes("**Update")) {
      updateWarning = "This post is old. Consider adding an 'Update' section instead of replacing content.";
    }

    // Create revision history if outside grace period
    if (!isGracePeriod) {
      await query(
        `INSERT INTO revision_history 
        (content_type, content_id, user_id, body_before, body_after, edit_reason)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
          "answer",
          answerId,
          currentUser.id,
          answer.body,
          body,
          editReason || null,
        ]
      );
    }

    // Update the answer
    let updateSql = "UPDATE answers SET body = ?";
    const updateParams: any[] = [body];

    // Update edited_at and edit_count if outside grace period
    if (!isGracePeriod) {
      updateSql += ", edited_at = NOW(), edit_count = edit_count + 1";
    }

    updateSql += " WHERE id = ?";
    updateParams.push(answerId);

    await query(updateSql, updateParams);

    return NextResponse.json({
      success: true,
      isGracePeriod,
      updateWarning,
      message: "Answer updated successfully",
    });
  } catch (error) {
    console.error("Error updating answer:", error);
    return NextResponse.json(
      { error: "Failed to update answer" },
      { status: 500 }
    );
  }
}
