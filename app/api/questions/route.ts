import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { query } from "@/lib/db";

// GET /api/questions - List all questions
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tag = searchParams.get("tag");
    const sort = searchParams.get("sort") || "newest";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 20;
    const offset = (page - 1) * limit;

    let queryText = `
      SELECT 
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
    `;

    const params: any[] = [];
    if (tag) {
      queryText += ` WHERE EXISTS (
        SELECT 1 FROM question_tags qt2 
        JOIN tags t2 ON qt2.tag_id = t2.id 
        WHERE qt2.question_id = q.id AND t2.name = $1
      )`;
      params.push(tag);
    }

    queryText += ` GROUP BY q.id, u.username, u.display_name, u.avatar_url, u.reputation`;

    switch (sort) {
      case "newest":
        queryText += ` ORDER BY q.created_at DESC`;
        break;
      case "votes":
        queryText += ` ORDER BY q.score DESC`;
        break;
      case "active":
        queryText += ` ORDER BY q.last_activity_at DESC`;
        break;
      case "unanswered":
        queryText += ` HAVING q.answer_count = 0 ORDER BY q.created_at DESC`;
        break;
    }

    queryText += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await query(queryText, params);

    return NextResponse.json({
      questions: result.rows,
      page,
      hasMore: result.rows.length === limit,
    });
  } catch (error) {
    console.error("Error fetching questions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/questions - Create a new question
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { title, body: questionBody, tags } = body;

    if (!title || !questionBody) {
      return NextResponse.json(
        { error: "Title and body are required" },
        { status: 400 }
      );
    }

    // Get user ID from email
    const userResult = await query(
      "SELECT id FROM users WHERE email = $1",
      [session.user.email]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const userId = userResult.rows[0].id;

    // Create question
    const questionResult = await query(
      `INSERT INTO questions (user_id, title, body) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [userId, title, questionBody]
    );

    const question = questionResult.rows[0];

    // Add tags
    if (tags && tags.length > 0) {
      for (const tagName of tags) {
        // Get or create tag
        let tagResult = await query(
          "SELECT id FROM tags WHERE name = $1",
          [tagName.toLowerCase()]
        );

        let tagId;
        if (tagResult.rows.length === 0) {
          const newTag = await query(
            "INSERT INTO tags (name) VALUES ($1) RETURNING id",
            [tagName.toLowerCase()]
          );
          tagId = newTag.rows[0].id;
        } else {
          tagId = tagResult.rows[0].id;
        }

        // Link question to tag
        await query(
          "INSERT INTO question_tags (question_id, tag_id) VALUES ($1, $2)",
          [question.id, tagId]
        );

        // Update tag count
        await query(
          "UPDATE tags SET question_count = question_count + 1 WHERE id = $1",
          [tagId]
        );
      }
    }

    return NextResponse.json(
      { question, message: "Question created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating question:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
