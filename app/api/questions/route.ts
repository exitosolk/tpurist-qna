import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { generateSlug } from "@/lib/slug";
import { getBadgeTierCounts } from "@/lib/badges";

// GET /api/questions - List all questions
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tag = searchParams.get("tag");
    const sort = searchParams.get("sort") || "newest";
    const filter = searchParams.get("filter");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    let queryText = `
      SELECT 
        q.*,
        u.username,
        u.display_name,
        u.avatar_url,
        u.reputation
      FROM questions q
      JOIN users u ON q.user_id = u.id
    `;

    const params: any[] = [];
    if (tag) {
      queryText += ` WHERE EXISTS (
        SELECT 1 FROM question_tags qt2 
        JOIN tags t2 ON qt2.tag_id = t2.id 
        WHERE qt2.question_id = q.id AND t2.name = ?
      )`;
      params.push(tag);
    }

    // Filter for unanswered questions
    if (filter === "unanswered") {
      queryText += tag ? " AND q.answer_count = 0" : " WHERE q.answer_count = 0";
    }

    queryText += ` ORDER BY `;

    switch (sort) {
      case "newest":
        queryText += `q.created_at DESC`;
        break;
      case "votes":
        queryText += `q.score DESC`;
        break;
      case "active":
        queryText += `q.last_activity_at DESC`;
        break;
      default:
        queryText += `q.created_at DESC`;
    }

    queryText += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const result = await query(queryText, params);

    // Add tags, collectives, and badge counts for each question
    const questionsWithExtras = await Promise.all(
      result.rows.map(async (question: any) => {
        // Get tags
        const tagsResult = await query(
          `SELECT t.id, t.name
           FROM question_tags qt
           JOIN tags t ON qt.tag_id = t.id
           WHERE qt.question_id = ?`,
          [question.id]
        );

        // Get collectives
        const collectivesResult = await query(
          `SELECT c.id, c.name, c.slug
           FROM collective_questions cq
           JOIN collectives c ON cq.collective_id = c.id
           WHERE cq.question_id = ?`,
          [question.id]
        );

        // Get badge counts
        const badgeCounts = await getBadgeTierCounts(question.user_id);

        return {
          ...question,
          tags: tagsResult.rows,
          collectives: collectivesResult.rows,
          badgeCounts,
        };
      })
    );

    return NextResponse.json({
      questions: questionsWithExtras,
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
    const { title, body: questionBody, tags, collectives } = body;

    if (!title || !questionBody) {
      return NextResponse.json(
        { error: "Title and body are required" },
        { status: 400 }
      );
    }

    // Get user ID from email
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
          error: "Please verify your email address before posting questions",
          verification_required: true 
        },
        { status: 403 }
      );
    }

    const userId = userResult.rows[0].id;

    // Create question
    const questionResult = await query(
      `INSERT INTO questions (user_id, title, body) 
       VALUES (?, ?, ?)`,
      [userId, title, questionBody]
    );

    const questionId = questionResult.insertId;

    // Generate slug (will be used in response)
    const slug = generateSlug(title, questionId);
    
    // Try to update slug column if it exists
    try {
      await query(
        "UPDATE questions SET slug = ? WHERE id = ?",
        [slug, questionId]
      );
    } catch (error: any) {
      // Ignore if slug column doesn't exist yet
      if (error.code !== 'ER_BAD_FIELD_ERROR') {
        throw error;
      }
    }

    // Add tags
    if (tags && tags.length > 0) {
      for (const tagName of tags) {
        // Get or create tag
        let tagResult = await query(
          "SELECT id FROM tags WHERE name = ?",
          [tagName.toLowerCase()]
        );

        let tagId;
        if (tagResult.rows.length === 0) {
          const newTag = await query(
            "INSERT INTO tags (name) VALUES (?)",
            [tagName.toLowerCase()]
          );
          tagId = newTag.insertId;
        } else {
          tagId = tagResult.rows[0].id;
        }

        // Link question to tag
        await query(
          "INSERT INTO question_tags (question_id, tag_id) VALUES (?, ?)",
          [questionId, tagId]
        );

        // Update tag count
        await query(
          "UPDATE tags SET question_count = question_count + 1 WHERE id = ?",
          [tagId]
        );
      }
    }

    // Add to collectives
    if (collectives && Array.isArray(collectives) && collectives.length > 0) {
      for (const collectiveId of collectives) {
        // Add question to collective
        await query(
          "INSERT INTO collective_questions (collective_id, question_id) VALUES (?, ?)",
          [collectiveId, questionId]
        );

        // Update collective question count
        await query(
          "UPDATE collectives SET question_count = question_count + 1 WHERE id = ?",
          [collectiveId]
        );
      }
    }

    return NextResponse.json(
      { questionId, slug, message: "Question created successfully" },
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
