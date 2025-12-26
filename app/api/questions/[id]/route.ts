import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const questionId = id;

    // Increment view count
    await query(
      "UPDATE questions SET views = views + 1 WHERE id = ?",
      [questionId]
    );

    // Get question with author info and tags
    const questionResult = await query(
      `SELECT 
        q.*,
        u.username,
        u.display_name,
        u.avatar_url,
        u.reputation,
        COALESCE(
          (SELECT JSON_ARRAYAGG(
            JSON_OBJECT('id', t.id, 'name', t.name)
          )
          FROM question_tags qt2
          JOIN tags t ON qt2.tag_id = t.id
          WHERE qt2.question_id = q.id),
          JSON_ARRAY()
        ) as tags
      FROM questions q
      JOIN users u ON q.user_id = u.id
      WHERE q.id = ?`,
      [questionId]
    );

    if (questionResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    const question = questionResult.rows[0];

    // Get answers with author info
    const answersResult = await query(
      `SELECT 
        a.*,
        u.username,
        u.display_name,
        u.avatar_url,
        u.reputation
      FROM answers a
      JOIN users u ON a.user_id = u.id
      WHERE a.question_id = ?
      ORDER BY a.is_accepted DESC, a.score DESC, a.created_at ASC`,
      [questionId]
    );

    const answers = answersResult.rows;

    // Get comments for question
    const questionCommentsResult = await query(
      `SELECT 
        c.*,
        u.username,
        u.display_name
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.commentable_type = 'question' AND c.commentable_id = $1
      ORDER BY c.created_at ASC`,
      [questionId]
    );

    return NextResponse.json({
      question: {
        ...question,
        comments: questionCommentsResult.rows,
      },
      answers,
    });
  } catch (error) {
    console.error("Error fetching question:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
