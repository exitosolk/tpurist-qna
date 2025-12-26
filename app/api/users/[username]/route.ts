import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;

    // Get user profile
    const userResult = await query(
      `SELECT id, username, display_name, email, reputation, created_at, bio, avatar_url
       FROM users WHERE username = ?`,
      [username]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const user = userResult.rows[0];

    // Get user's questions
    const questionsResult = await query(
      `SELECT id, slug, title, score, answer_count, views, created_at
       FROM questions
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 50`,
      [user.id]
    );

    // Get user's answers with question titles
    const answersResult = await query(
      `SELECT a.id, a.question_id, a.score, a.is_accepted, a.created_at,
              q.title as question_title, q.slug as question_slug
       FROM answers a
       JOIN questions q ON a.question_id = q.id
       WHERE a.user_id = ?
       ORDER BY a.created_at DESC
       LIMIT 50`,
      [user.id]
    );

    // Don't expose email to other users
    const publicProfile = {
      ...user,
      email: undefined
    };

    return NextResponse.json({
      profile: publicProfile,
      questions: questionsResult.rows,
      answers: answersResult.rows,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
