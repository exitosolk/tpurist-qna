import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

// GET - Check if user is following specific questions or tags
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const questionIds = searchParams.get("questionIds")?.split(",").filter(Boolean) || [];
    const tagNames = searchParams.get("tagNames")?.split(",").filter(Boolean) || [];

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
    const result: any = {};

    // Check question follows
    if (questionIds.length > 0) {
      const placeholders = questionIds.map(() => "?").join(",");
      const questionFollows = await query(
        `SELECT question_id FROM question_follows 
         WHERE user_id = ? AND question_id IN (${placeholders})`,
        [userId, ...questionIds]
      );
      
      result.questionFollows = questionFollows.rows.reduce((acc: any, row: any) => {
        acc[row.question_id] = true;
        return acc;
      }, {});
    }

    // Check tag follows
    if (tagNames.length > 0) {
      const placeholders = tagNames.map(() => "?").join(",");
      const tagFollows = await query(
        `SELECT tag_name FROM tag_follows 
         WHERE user_id = ? AND tag_name IN (${placeholders})`,
        [userId, ...tagNames]
      );
      
      result.tagFollows = tagFollows.rows.reduce((acc: any, row: any) => {
        acc[row.tag_name] = true;
        return acc;
      }, {});
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error checking follows:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
