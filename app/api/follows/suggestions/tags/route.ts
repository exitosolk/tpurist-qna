import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

// GET - Get suggested tags based on user activity
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id as string);
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "5");

    // Get suggested tags based on:
    // 1. Tags from questions the user has asked
    // 2. Tags from questions the user has answered
    // 3. Tags from questions the user has upvoted
    // 4. Exclude tags the user is already following
    const [suggestions] = await pool.query<RowDataPacket[]>(
      `SELECT 
        t.id,
        t.name,
        t.description,
        COUNT(DISTINCT q.id) as question_count
       FROM tags t
       INNER JOIN question_tags qt ON t.id = qt.tag_id
       INNER JOIN questions q ON qt.question_id = q.id
       WHERE t.name NOT IN (
         SELECT tag_name FROM tag_follows WHERE user_id = ?
       )
       AND (
         q.user_id = ? OR
         EXISTS (SELECT 1 FROM answers a WHERE a.question_id = q.id AND a.user_id = ?) OR
         EXISTS (SELECT 1 FROM votes v WHERE v.votable_id = q.id AND v.votable_type = 'question' AND v.user_id = ? AND v.vote_type = 1)
       )
       GROUP BY t.id, t.name, t.description
       ORDER BY question_count DESC
       LIMIT ?`,
      [userId, userId, userId, userId, limit]
    );

    // Calculate activity reasons for each suggestion
    const suggestionsWithReasons = suggestions.map((tag: any) => {
      return {
        name: tag.name,
        description: tag.description,
        questionCount: tag.question_count,
        reason: 'Based on your activity',
        activityScore: tag.question_count,
      };
    });

    return NextResponse.json({
      success: true,
      suggestions: suggestionsWithReasons,
    });

  } catch (error) {
    console.error("Error fetching tag suggestions:", error);
    return NextResponse.json(
      { error: "Failed to fetch tag suggestions" },
      { status: 500 }
    );
  }
}
