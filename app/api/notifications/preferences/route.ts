import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

interface NotificationPreferences {
  id: number;
  user_id: number;
  email_new_answer: boolean;
  email_new_comment: boolean;
  email_question_upvote: boolean;
  email_question_downvote: boolean;
  email_answer_upvote: boolean;
  email_answer_downvote: boolean;
  email_accepted_answer: boolean;
  email_badge_earned: boolean;
  email_followed_question: boolean;
  app_new_answer: boolean;
  app_new_comment: boolean;
  app_question_upvote: boolean;
  app_question_downvote: boolean;
  app_answer_upvote: boolean;
  app_answer_downvote: boolean;
  app_accepted_answer: boolean;
  app_badge_earned: boolean;
  app_followed_question: boolean;
  digest_frequency: 'none' | 'daily' | 'weekly';
  digest_include_new_questions: boolean;
  digest_include_top_questions: boolean;
  digest_include_followed_tags: boolean;
}

// GET - Fetch user's notification preferences
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const connection = pool;

    // Get user ID
    const [users] = await connection.execute<RowDataPacket[]>(
      "SELECT id FROM users WHERE email = ?",
      [session.user.email]
    );

    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = users[0].id;

    // Get or create preferences
    const [preferences] = await connection.execute<RowDataPacket[]>(
      "SELECT * FROM notification_preferences WHERE user_id = ?",
      [userId]
    );

    if (preferences.length === 0) {
      // Create default preferences
      await connection.execute(
        `INSERT INTO notification_preferences (user_id) VALUES (?)`,
        [userId]
      );

      // Fetch the newly created preferences
      const [newPreferences] = await connection.execute<RowDataPacket[]>(
        "SELECT * FROM notification_preferences WHERE user_id = ?",
        [userId]
      );

      return NextResponse.json({ preferences: newPreferences[0] });
    }

    return NextResponse.json({ preferences: preferences[0] });
  } catch (error) {
    console.error("Error fetching notification preferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch notification preferences" },
      { status: 500 }
    );
  }
}

// PATCH - Update user's notification preferences
export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const connection = pool;

    // Get user ID
    const [users] = await connection.execute<RowDataPacket[]>(
      "SELECT id FROM users WHERE email = ?",
      [session.user.email]
    );

    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = users[0].id;

    // Build update query dynamically based on provided fields
    const allowedFields = [
      'email_new_answer',
      'email_new_comment',
      'email_question_upvote',
      'email_question_downvote',
      'email_answer_upvote',
      'email_answer_downvote',
      'email_accepted_answer',
      'email_badge_earned',
      'email_followed_question',
      'app_new_answer',
      'app_new_comment',
      'app_question_upvote',
      'app_question_downvote',
      'app_answer_upvote',
      'app_answer_downvote',
      'app_accepted_answer',
      'app_badge_earned',
      'app_followed_question',
      'digest_frequency',
      'digest_include_new_questions',
      'digest_include_top_questions',
      'digest_include_followed_tags',
    ];

    const updates: string[] = [];
    const values: any[] = [];

    for (const field of allowedFields) {
      if (field in body) {
        updates.push(`${field} = ?`);
        values.push(body[field]);
      }
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    values.push(userId);

    // Ensure preferences exist
    const [existing] = await connection.execute<RowDataPacket[]>(
      "SELECT id FROM notification_preferences WHERE user_id = ?",
      [userId]
    );

    if (existing.length === 0) {
      await connection.execute(
        "INSERT INTO notification_preferences (user_id) VALUES (?)",
        [userId]
      );
    }

    // Update preferences
    await connection.execute(
      `UPDATE notification_preferences SET ${updates.join(', ')} WHERE user_id = ?`,
      values
    );

    // Fetch updated preferences
    const [updated] = await connection.execute<RowDataPacket[]>(
      "SELECT * FROM notification_preferences WHERE user_id = ?",
      [userId]
    );

    return NextResponse.json({ preferences: updated[0] });
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    return NextResponse.json(
      { error: "Failed to update notification preferences" },
      { status: 500 }
    );
  }
}
