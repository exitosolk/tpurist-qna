import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { createNotification } from "@/lib/notifications";

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
    const { body: answerBody, experience_date } = body;

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
      experience_date
        ? `INSERT INTO answers (question_id, user_id, body, experience_date) VALUES (?, ?, ?, ?)`
        : `INSERT INTO answers (question_id, user_id, body) VALUES (?, ?, ?)`,
      experience_date
        ? [questionId, userId, answerBody, experience_date]
        : [questionId, userId, answerBody]
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

    // Get question owner to send notification
    const questionResult = await query(
      "SELECT user_id, title FROM questions WHERE id = ?",
      [questionId]
    );

    if (questionResult.rows && questionResult.rows.length > 0) {
      const questionOwnerId = questionResult.rows[0].user_id;
      const questionTitle = questionResult.rows[0].title;

      // Create notification for question owner
      await createNotification({
        userId: questionOwnerId,
        type: 'answer',
        actorId: userId,
        message: `answered your question "${questionTitle}"`,
        questionId: parseInt(questionId),
        answerId: answerId,
      });
    }

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
