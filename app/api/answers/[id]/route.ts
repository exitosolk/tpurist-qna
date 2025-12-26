import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

// PATCH - Update answer
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const answerId = id;
    const body = await req.json();
    const { body: answerBody } = body;

    if (!answerBody || answerBody.trim().length < 10) {
      return NextResponse.json(
        { error: "Answer must be at least 10 characters" },
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

    // Check if user owns the answer
    const answerResult = await query(
      "SELECT user_id FROM answers WHERE id = ?",
      [answerId]
    );

    if (answerResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Answer not found" },
        { status: 404 }
      );
    }

    if (answerResult.rows[0].user_id !== userId) {
      return NextResponse.json(
        { error: "You can only edit your own answers" },
        { status: 403 }
      );
    }

    // Update answer
    await query(
      "UPDATE answers SET body = ?, updated_at = NOW() WHERE id = ?",
      [answerBody.trim(), answerId]
    );

    return NextResponse.json({ message: "Answer updated successfully" });
  } catch (error) {
    console.error("Error updating answer:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
