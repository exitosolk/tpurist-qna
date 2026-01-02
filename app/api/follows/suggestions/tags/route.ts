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
    const [suggestions] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        t.name,
        t.description,
        COUNT(DISTINCT qt.question_id) as question_count,
        SUM(CASE WHEN q.user_id = ? THEN 3 ELSE 0 END) as asked_score,
        SUM(CASE WHEN a.user_id = ? THEN 2 ELSE 0 END) as answered_score,
        SUM(CASE WHEN qv.user_id = ? AND qv.vote_type = 'upvote' THEN 1 ELSE 0 END) as upvoted_score,
        (
          SUM(CASE WHEN q.user_id = ? THEN 3 ELSE 0 END) +
          SUM(CASE WHEN a.user_id = ? THEN 2 ELSE 0 END) +
          SUM(CASE WHEN qv.user_id = ? AND qv.vote_type = 'upvote' THEN 1 ELSE 0 END)
        ) as total_score
       FROM tags t
       INNER JOIN question_tags qt ON t.name = qt.tag_name
       INNER JOIN questions q ON qt.question_id = q.id
       LEFT JOIN answers a ON q.id = a.question_id AND a.user_id = ?
       LEFT JOIN question_votes qv ON q.id = qv.question_id AND qv.user_id = ?
       WHERE t.name NOT IN (
         SELECT tag_name FROM tag_follows WHERE user_id = ?
       )
       AND (
         q.user_id = ? OR
         a.user_id = ? OR
         qv.user_id = ?
       )
       GROUP BY t.name, t.description
       HAVING total_score > 0
       ORDER BY total_score DESC, question_count DESC
       LIMIT ?`,
      [userId, userId, userId, userId, userId, userId, userId, userId, userId, userId, userId, userId, limit]
    );

    // Calculate activity reasons for each suggestion
    const suggestionsWithReasons = suggestions.map((tag: any) => {
      const reasons = [];
      if (tag.asked_score > 0) {
        reasons.push(`You've asked questions in this topic`);
      }
      if (tag.answered_score > 0) {
        reasons.push(`You've answered questions in this topic`);
      }
      if (tag.upvoted_score > 0) {
        reasons.push(`You've upvoted questions in this topic`);
      }

      return {
        name: tag.name,
        description: tag.description,
        questionCount: tag.question_count,
        reason: reasons[0] || 'Based on your activity',
        activityScore: tag.total_score,
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
