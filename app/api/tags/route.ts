import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    // Get popular tags by question count
    const result = await query(
      `SELECT t.name, COUNT(qt.question_id) as count
       FROM tags t
       LEFT JOIN question_tags qt ON t.id = qt.tag_id
       GROUP BY t.id, t.name
       ORDER BY count DESC
       LIMIT ?`,
      [limit]
    );

    return NextResponse.json({ tags: result.rows });
  } catch (error) {
    console.error("Error fetching tags:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
