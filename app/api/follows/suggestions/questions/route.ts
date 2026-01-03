import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

// GET - Get suggested questions based on user activity
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

    // Get suggested questions based on:
    // 1. Questions in tags the user follows
    // 2. Questions in tags the user has asked about
    // 3. Popular unanswered questions in user's interested topics
    // 4. Exclude questions the user already follows
    // 5. Exclude user's own questions
    const [suggestions] = await pool.execute<RowDataPacket[]>(
      `SELECT DISTINCT
        q.id,
        q.title,
        q.slug,
        q.view_count,
        q.created_at,
        u.username as author_username,
        u.avatar_url as author_avatar,
        COUNT(DISTINCT a.id) as answer_count,
        (
          SELECT COUNT(*) FROM question_tags qt2
          INNER JOIN tag_follows tf ON qt2.tag_name = tf.tag_name
          WHERE qt2.question_id = q.id AND tf.user_id = ?
        ) as matching_tags_count,
        (
          SELECT GROUP_CONCAT(qt3.tag_name SEPARATOR ', ')
          FROM question_tags qt3
          WHERE qt3.question_id = q.id
          LIMIT 3
        ) as tags,
        CASE
          WHEN EXISTS (
            SELECT 1 FROM tag_follows tf
            INNER JOIN question_tags qt ON tf.tag_name = qt.tag_name
            WHERE tf.user_id = ? AND qt.question_id = q.id
          ) THEN 'You follow this topic'
          WHEN EXISTS (
            SELECT 1 FROM question_tags qt
            INNER JOIN (
              SELECT DISTINCT qt2.tag_name
              FROM question_tags qt2
              INNER JOIN questions q2 ON qt2.question_id = q2.id
              WHERE q2.user_id = ?
            ) user_tags ON qt.tag_name = user_tags.tag_name
            WHERE qt.question_id = q.id
          ) THEN 'Similar to questions you\'ve asked'
          ELSE 'Trending in your interests'
        END as reason
       FROM questions q
       INNER JOIN users u ON q.user_id = u.id
       LEFT JOIN answers a ON q.id = a.question_id
       INNER JOIN question_tags qt ON q.id = qt.question_id
       WHERE q.user_id != ?
       AND q.id NOT IN (
         SELECT question_id FROM question_follows WHERE user_id = ?
       )
       AND (
         -- Questions in tags user follows
         qt.tag_name IN (
           SELECT tag_name FROM tag_follows WHERE user_id = ?
         )
         OR
         -- Questions in tags user has asked about
         qt.tag_name IN (
           SELECT DISTINCT qt2.tag_name
           FROM question_tags qt2
           INNER JOIN questions q2 ON qt2.question_id = q2.id
           WHERE q2.user_id = ?
         )
       )
       GROUP BY q.id
       ORDER BY matching_tags_count DESC, q.view_count DESC, q.created_at DESC
       LIMIT ?`,
      [userId, userId, userId, userId, userId, userId, userId, limit]
    );

    return NextResponse.json({
      success: true,
      suggestions: suggestions.map((q: any) => ({
        id: q.id,
        title: q.title,
        slug: q.slug,
        viewCount: q.view_count,
        answerCount: q.answer_count,
        tags: q.tags ? q.tags.split(', ') : [],
        author: {
          username: q.author_username,
          avatarUrl: q.author_avatar,
        },
        reason: q.reason,
        matchingTagsCount: q.matching_tags_count,
        createdAt: q.created_at,
      })),
    });

  } catch (error) {
    console.error("Error fetching question suggestions:", error);
    return NextResponse.json(
      { error: "Failed to fetch question suggestions" },
      { status: 500 }
    );
  }
}
