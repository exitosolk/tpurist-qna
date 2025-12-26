import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");

    if (!q || q.trim().length === 0) {
      return NextResponse.json({ questions: [] });
    }

    const searchTerm = `%${q.trim()}%`;

    // Search in questions (title and body) and include tags
    const result = await query(
      `SELECT DISTINCT
        q.id,
        q.title,
        q.body,
        q.slug,
        q.views,
        q.score,
        q.created_at,
        u.username,
        u.display_name,
        u.reputation,
        (SELECT COUNT(*) FROM answers WHERE question_id = q.id) as answer_count,
        (SELECT GROUP_CONCAT(t.name) 
         FROM question_tags qt 
         JOIN tags t ON qt.tag_id = t.id 
         WHERE qt.question_id = q.id) as tags
       FROM questions q
       JOIN users u ON q.user_id = u.id
       LEFT JOIN question_tags qt ON q.id = qt.question_id
       LEFT JOIN tags t ON qt.tag_id = t.id
       WHERE q.title LIKE ? 
          OR q.body LIKE ?
          OR t.name LIKE ?
       ORDER BY q.created_at DESC
       LIMIT 50`,
      [searchTerm, searchTerm, searchTerm]
    );

    return NextResponse.json({ questions: result.rows });
  } catch (error) {
    console.error("Error searching questions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
