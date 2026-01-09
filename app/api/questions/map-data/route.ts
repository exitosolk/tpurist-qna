import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET /api/questions/map-data - Get all questions with locations for map pins
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const bounds = searchParams.get("bounds"); // Format: "minLat,minLon,maxLat,maxLon"
    const tag = searchParams.get("tag");

    let queryText = `
      SELECT 
        q.id,
        q.slug,
        q.title,
        q.place_name,
        q.formatted_address,
        q.latitude,
        q.longitude,
        q.score,
        q.answer_count,
        q.views,
        q.created_at,
        u.username,
        u.display_name
      FROM questions q
      JOIN users u ON q.user_id = u.id
      WHERE q.latitude IS NOT NULL 
        AND q.longitude IS NOT NULL
    `;

    const params: any[] = [];

    // Filter by bounds if provided
    if (bounds) {
      const [minLat, minLon, maxLat, maxLon] = bounds.split(",").map(parseFloat);
      queryText += ` AND q.latitude BETWEEN ? AND ?
                     AND q.longitude BETWEEN ? AND ?`;
      params.push(minLat, maxLat, minLon, maxLon);
    }

    // Filter by tag if provided
    if (tag) {
      queryText += ` AND EXISTS (
        SELECT 1 FROM question_tags qt 
        JOIN tags t ON qt.tag_id = t.id 
        WHERE qt.question_id = q.id AND t.name = ?
      )`;
      params.push(tag);
    }

    queryText += ` ORDER BY q.created_at DESC LIMIT 500`;

    const result = await query(queryText, params);

    // Add tags for each question
    const questionsWithTags = await Promise.all(
      result.rows.map(async (question: any) => {
        const tagsResult = await query(
          `SELECT t.id, t.name
           FROM question_tags qt
           JOIN tags t ON qt.tag_id = t.id
           WHERE qt.question_id = ?
           LIMIT 3`,
          [question.id]
        );

        return {
          ...question,
          latitude: Number(question.latitude),
          longitude: Number(question.longitude),
          tags: tagsResult.rows,
        };
      })
    );

    return NextResponse.json({
      questions: questionsWithTags,
      total: questionsWithTags.length,
    });
  } catch (error) {
    console.error("Error fetching map data:", error);
    return NextResponse.json(
      { error: "Failed to fetch map data" },
      { status: 500 }
    );
  }
}
