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

    // Get user's badges
    const badgesResult = await query(
      `SELECT b.id, b.name, b.tier, b.description, b.icon, ub.awarded_at
       FROM user_badges ub
       JOIN badges b ON ub.badge_id = b.id
       WHERE ub.user_id = ?
       ORDER BY 
         CASE b.tier
           WHEN 'gold' THEN 1
           WHEN 'silver' THEN 2
           WHEN 'bronze' THEN 3
         END,
         ub.awarded_at DESC`,
      [user.id]
    );

    // Get user's reputation history (last 50 entries)
    const reputationHistoryResult = await query(
      `SELECT id, change_amount, reason, reference_type, reference_id, created_at
       FROM reputation_history
       WHERE user_id = ?
       ORDER BY created_at DESC
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
      badges: badgesResult.rows,
      reputationHistory: reputationHistoryResult.rows,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
