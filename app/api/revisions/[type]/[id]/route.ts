import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  try {
    const { type, id } = await params;
    
    if (!['question', 'answer'].includes(type)) {
      return NextResponse.json({ error: "Invalid content type" }, { status: 400 });
    }

    const contentId = parseInt(id);

    // Get revision history
    const result = await query(
      `SELECT 
        rh.*,
        u.username,
        u.display_name
       FROM revision_history rh
       JOIN users u ON rh.user_id = u.id
       WHERE rh.content_type = ? AND rh.content_id = ?
       ORDER BY rh.created_at DESC`,
      [type, contentId]
    );

    return NextResponse.json({ revisions: result.rows });
  } catch (error) {
    console.error("Error fetching revision history:", error);
    return NextResponse.json(
      { error: "Failed to fetch revision history" },
      { status: 500 }
    );
  }
}
