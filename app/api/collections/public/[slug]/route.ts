import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET /api/collections/public/[slug] - Get public collection by slug
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const searchParams = req.nextUrl.searchParams;
    const username = searchParams.get("username");

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    // Get collection
    const collectionResult = await query(
      `SELECT 
        c.id,
        c.user_id,
        c.name,
        c.description,
        c.slug,
        c.is_public,
        c.created_at,
        c.updated_at,
        u.username,
        u.display_name
      FROM collections c
      JOIN users u ON c.user_id = u.id
      WHERE c.slug = ? AND u.username = ? AND c.is_public = TRUE`,
      [slug, username]
    );

    if (!collectionResult.rows || collectionResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Public collection not found" },
        { status: 404 }
      );
    }

    const collection = collectionResult.rows[0];

    // Get collection items
    const itemsResult = await query(
      `SELECT 
        ci.id,
        ci.question_id,
        ci.note,
        ci.added_at,
        q.title,
        q.slug as question_slug,
        q.score,
        q.answer_count,
        q.view_count,
        u.username as author_username,
        u.display_name as author_display_name
      FROM collection_items ci
      JOIN questions q ON ci.question_id = q.id
      JOIN users u ON q.user_id = u.id
      WHERE ci.collection_id = ?
      ORDER BY ci.added_at DESC`,
      [collection.id]
    );

    return NextResponse.json({
      collection: {
        ...collection,
        item_count: itemsResult.rows?.length || 0,
      },
      items: itemsResult.rows || [],
    });
  } catch (error) {
    console.error("Error fetching public collection:", error);
    return NextResponse.json(
      { error: "Failed to fetch collection" },
      { status: 500 }
    );
  }
}
