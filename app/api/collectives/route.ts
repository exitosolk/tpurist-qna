import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET /api/collectives - List all collectives
export async function GET() {
  try {
    const result = await query(
      `SELECT 
        id, 
        name, 
        slug, 
        description, 
        icon_url, 
        cover_image_url,
        member_count, 
        question_count,
        created_at
      FROM collectives 
      ORDER BY member_count DESC, question_count DESC`,
      []
    );

    return NextResponse.json({
      collectives: result.rows,
    });
  } catch (error) {
    console.error("Error fetching collectives:", error);
    return NextResponse.json(
      { error: "Failed to fetch collectives" },
      { status: 500 }
    );
  }
}
