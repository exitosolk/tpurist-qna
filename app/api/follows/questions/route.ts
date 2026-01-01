import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

// POST - Follow/Unfollow a question
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { questionId } = body;

    if (!questionId) {
      return NextResponse.json(
        { error: "Question ID is required" },
        { status: 400 }
      );
    }

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

    // Check if question exists
    const questionResult = await query(
      "SELECT id FROM questions WHERE id = ?",
      [questionId]
    );

    if (questionResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    // Check if already following
    const existingFollow = await query(
      `SELECT * FROM question_follows 
       WHERE user_id = ? AND question_id = ?`,
      [userId, questionId]
    );

    if (existingFollow.rows.length > 0) {
      // Unfollow
      await query(
        `DELETE FROM question_follows 
         WHERE user_id = ? AND question_id = ?`,
        [userId, questionId]
      );

      return NextResponse.json({ 
        message: "Unfollowed question successfully",
        isFollowing: false
      });
    } else {
      // Follow
      await query(
        `INSERT INTO question_follows (user_id, question_id) 
         VALUES (?, ?)`,
        [userId, questionId]
      );

      return NextResponse.json({ 
        message: "Following question successfully",
        isFollowing: true
      }, { status: 201 });
    }
  } catch (error) {
    console.error("Error toggling question follow:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - Get all questions the user is following
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

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

    // Get all followed questions
    const followedQuestions = await query(
      `SELECT 
        qf.id as follow_id,
        qf.created_at as followed_at,
        q.id as question_id,
        q.slug,
        q.title,
        q.score,
        q.answer_count,
        q.views,
        q.created_at
       FROM question_follows qf
       JOIN questions q ON qf.question_id = q.id
       WHERE qf.user_id = ?
       ORDER BY qf.created_at DESC`,
      [userId]
    );

    return NextResponse.json({
      followedQuestions: followedQuestions.rows
    });
  } catch (error) {
    console.error("Error fetching followed questions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
