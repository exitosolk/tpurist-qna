import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const answerId = params.id;

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

    return NextResponse.json({ message: "Answer accepted successfully" });
  } catch (error) {
    console.error("Error accepting answer:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
