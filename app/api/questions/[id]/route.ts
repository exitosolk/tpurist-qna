import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const questionId = params.id;

    // Increment view count
    await query(
      "UPDATE questions SET views = views + 1 WHERE id = $1",
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
        COALESCE(json_agg(
          DISTINCT jsonb_build_object('id', t.id, 'name', t.name)
        ) FILTER (WHERE t.id IS NOT NULL), '[]') as tags
      FROM questions q
      JOIN users u ON q.user_id = u.id
      LEFT JOIN question_tags qt ON q.id = qt.question_id
      LEFT JOIN tags t ON qt.tag_id = t.id
      WHERE q.id = $1
      GROUP BY q.id, u.username, u.display_name, u.avatar_url, u.reputation`,
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
      WHERE a.question_id = $1
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
