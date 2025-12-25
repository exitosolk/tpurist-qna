import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
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
      "SELECT id FROM users WHERE email = $1",
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
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [questionId, userId, answerBody]
    );

    const answer = answerResult.rows[0];

    // Update question answer count and last activity
    await query(
      `UPDATE questions 
       SET answer_count = answer_count + 1, 
           last_activity_at = CURRENT_TIMESTAMP 
       WHERE id = $1`,
      [questionId]
    );

    return NextResponse.json(
      { answer, message: "Answer posted successfully" },
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
