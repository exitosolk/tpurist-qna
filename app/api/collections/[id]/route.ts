import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

// GET /api/collections/[id] - Get collection details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    const collectionId = parseInt(id);

    if (isNaN(collectionId)) {
      return NextResponse.json(
        { error: "Invalid collection ID" },
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
      WHERE c.id = ?`,
      [collectionId]
    );

    if (!collectionResult.rows || collectionResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 }
      );
    }

    const collection = collectionResult.rows[0];

    // Check permissions
    const isOwner = session?.user?.id && parseInt(session.user.id) === collection.user_id;
    if (!collection.is_public && !isOwner) {
      return NextResponse.json(
        { error: "Access denied. This collection is private." },
        { status: 403 }
      );
    }

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
        q.views as view_count,
        u.username as author_username,
        u.display_name as author_display_name
      FROM collection_items ci
      JOIN questions q ON ci.question_id = q.id
      JOIN users u ON q.user_id = u.id
      WHERE ci.collection_id = ?
      ORDER BY ci.added_at DESC`,
      [collectionId]
    );

    return NextResponse.json({
      collection: {
        ...collection,
        is_owner: isOwner,
        item_count: itemsResult.rows?.length || 0,
      },
      items: itemsResult.rows || [],
    });
  } catch (error) {
    console.error("Error fetching collection:", error);
    return NextResponse.json(
      { error: "Failed to fetch collection" },
      { status: 500 }
    );
  }
}

// PATCH /api/collections/[id] - Update collection
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);
    const { id } = await params;
    const collectionId = parseInt(id);

    if (isNaN(collectionId)) {
      return NextResponse.json(
        { error: "Invalid collection ID" },
        { status: 400 }
      );
    }

    // Verify ownership
    const ownerCheck = await query(
      "SELECT user_id FROM collections WHERE id = ?",
      [collectionId]
    );

    if (!ownerCheck.rows || ownerCheck.rows.length === 0) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 }
      );
    }

    if (ownerCheck.rows[0].user_id !== userId) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const { name, description, is_public } = await req.json();

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];

    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        return NextResponse.json(
          { error: "Collection name cannot be empty" },
          { status: 400 }
        );
      }
      if (name.length > 255) {
        return NextResponse.json(
          { error: "Collection name is too long" },
          { status: 400 }
        );
      }
      updates.push("name = ?");
      values.push(name.trim());
    }

    if (description !== undefined) {
      updates.push("description = ?");
      values.push(description || null);
    }

    if (is_public !== undefined) {
      updates.push("is_public = ?");
      values.push(is_public);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    values.push(collectionId);

    await query(
      `UPDATE collections SET ${updates.join(", ")} WHERE id = ?`,
      values
    );

    // Fetch updated collection
    const updated = await query(
      `SELECT 
        c.id,
        c.name,
        c.description,
        c.slug,
        c.is_public,
        c.created_at,
        c.updated_at,
        COUNT(ci.id) as item_count
      FROM collections c
      LEFT JOIN collection_items ci ON c.id = ci.collection_id
      WHERE c.id = ?
      GROUP BY c.id, c.name, c.description, c.slug, c.is_public, c.created_at, c.updated_at`,
      [collectionId]
    );

    return NextResponse.json({
      message: "Collection updated successfully",
      collection: updated.rows?.[0],
    });
  } catch (error) {
    console.error("Error updating collection:", error);
    return NextResponse.json(
      { error: "Failed to update collection" },
      { status: 500 }
    );
  }
}

// DELETE /api/collections/[id] - Delete collection
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);
    const { id } = await params;
    const collectionId = parseInt(id);

    if (isNaN(collectionId)) {
      return NextResponse.json(
        { error: "Invalid collection ID" },
        { status: 400 }
      );
    }

    // Verify ownership
    const ownerCheck = await query(
      "SELECT user_id FROM collections WHERE id = ?",
      [collectionId]
    );

    if (!ownerCheck.rows || ownerCheck.rows.length === 0) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 }
      );
    }

    if (ownerCheck.rows[0].user_id !== userId) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Delete collection (items will be deleted via CASCADE)
    await query("DELETE FROM collections WHERE id = ?", [collectionId]);

    return NextResponse.json({
      message: "Collection deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting collection:", error);
    return NextResponse.json(
      { error: "Failed to delete collection" },
      { status: 500 }
    );
  }
}
