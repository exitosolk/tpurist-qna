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
        tag_id,
        tag_name,
        tag_description,
        question_count,
        asked_score,
        answered_score,
        upvoted_score,
        (asked_score + answered_score + upvoted_score) as total_score
       FROM (
         SELECT 
           t.id as tag_id,
           t.name as tag_name,
           t.description as tag_description,
           COUNT(DISTINCT q.id) as question_count,
           SUM(CASE WHEN q.user_id = ? THEN 3 ELSE 0 END) as asked_score,
           SUM(CASE WHEN a.user_id = ? THEN 2 ELSE 0 END) as answered_score,
           SUM(CASE WHEN v.user_id = ? AND v.vote_type = 1 THEN 1 ELSE 0 END) as upvoted_score
         FROM tags t
         INNER JOIN question_tags qt ON t.id = qt.tag_id
         INNER JOIN questions q ON qt.question_id = q.id
         LEFT JOIN answers a ON q.id = a.question_id
         LEFT JOIN votes v ON q.id = v.votable_id AND v.votable_type = 'question'
         WHERE t.name NOT IN (
           SELECT tag_name FROM tag_follows WHERE user_id = ?
         )
         AND (
           q.user_id = ? OR
           a.user_id = ? OR
           v.user_id = ?
         )
         GROUP BY t.id, t.name, t.description
       ) AS tag_scores
       WHERE (asked_score + answered_score + upvoted_score) > 0
       ORDER BY total_score DESC, question_count DESC
       LIMIT ?`,
      [userId, userId, userId, userId, userId, userId, userId, limit]
    );

    // Calculate activity reasons for each suggestion
    const suggestionsWithReasons = suggestions.map((tag: any) => {
      const reasons = [];
      if (tag.asked_score > 0) {
        reasons.push(`You have asked questions in this topic`);
      }
      if (tag.answered_score > 0) {
        reasons.push(`You have answered questions in this topic`);
      }
      if (tag.upvoted_score > 0) {
        reasons.push(`You have upvoted questions in this topic`);
      }

      return {
        name: tag.tag_name,
        description: tag.tag_description,
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
