import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user profile
    const userResult = await query(
      "SELECT id, email, username, display_name, reputation, created_at, avatar_url, bio, email_verified FROM users WHERE email = ?",
      [session.user.email]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const profile = userResult.rows[0];

    // Get user's questions
    const questionsResult = await query(
      `SELECT id, slug, title, score, answer_count, views, created_at 
       FROM questions 
       WHERE user_id = ? 
       ORDER BY created_at DESC`,
      [profile.id]
    );

    // Get user's answers with question titles
    const answersResult = await query(
      `SELECT a.id, a.question_id, a.score, a.is_accepted, a.created_at, q.title as question_title
       FROM answers a
       JOIN questions q ON a.question_id = q.id
       WHERE a.user_id = ?
       ORDER BY a.created_at DESC`,
      [profile.id]
    );

    return NextResponse.json({
      profile,
      questions: questionsResult.rows,
      answers: answersResult.rows,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
