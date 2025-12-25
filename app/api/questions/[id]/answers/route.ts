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
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { body: answerBody } = body;

    if (!answerBody) {
      return NextResponse.json(
        { error: "Answer body is required" },
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
    const questionId = params.id;

    // Create answer
    const answerResult = await query(
      `INSERT INTO answers (question_id, user_id, body) 
       VALUES (?, ?, ?)`,
      [questionId, userId, answerBody]
    );

    const answerId = answerResult.insertId;

    // Update question answer count and last activity
    await query(
      `UPDATE questions 
       SET answer_count = answer_count + 1, 
           last_activity_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [questionId]
    );

    return NextResponse.json(
      { answerId, message: "Answer posted successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating answer:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
