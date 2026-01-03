import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { checkRateLimit, recordRateLimitAction } from "@/lib/rate-limit";

// GET comments for an answer
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const answerId = id;

    const result = await query(
      `SELECT c.*, u.username, u.display_name, u.reputation
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.commentable_type = 'answer' AND c.commentable_id = ?
       ORDER BY c.created_at ASC`,
      [answerId]
    );

    return NextResponse.json({ comments: result.rows });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST new comment
export async function POST(
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
    const { text } = body;

    if (!text || text.trim().length < 3) {
      return NextResponse.json(
        { error: "Comment must be at least 3 characters" },
        { status: 400 }
      );
    }

    // Get user ID
    const userResult = await query(
      "SELECT id, email_verified FROM users WHERE email = ?",
      [session.user.email]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check email verification
    if (!userResult.rows[0].email_verified) {
      return NextResponse.json(
        { 
          error: "Please verify your email address before posting comments",
          verification_required: true 
        },
        { status: 403 }
      );
    }

    const userId = userResult.rows[0].id;

    // Check rate limit
    const rateLimitCheck = await checkRateLimit(userId, 'comment');
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { 
          error: rateLimitCheck.message,
          rate_limit_exceeded: true,
          limit: rateLimitCheck.limit,
          resetAt: rateLimitCheck.resetAt
        },
        { status: 429 }
      );
    }

    // Insert comment
    await query(
      `INSERT INTO comments (commentable_type, commentable_id, user_id, text)
       VALUES (?, ?, ?, ?)`,
      ["answer", answerId, userId, text]
    );

    // Record rate limit action
    await recordRateLimitAction(userId, 'comment');

    return NextResponse.json({ message: "Comment added successfully" }, { status: 201 });
  } catch (error) {
    console.error("Error adding comment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
