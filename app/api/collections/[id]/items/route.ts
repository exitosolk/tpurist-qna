import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

// POST /api/collections/[id]/items - Add question to collection
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
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
    const collectionId = parseInt(params.id);
    const { question_id, note } = await req.json();

    if (isNaN(collectionId) || isNaN(question_id)) {
      return NextResponse.json(
        { error: "Invalid collection or question ID" },
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

    // Verify question exists
    const questionCheck = await query(
      "SELECT id FROM questions WHERE id = ?",
      [question_id]
    );

    if (!questionCheck.rows || questionCheck.rows.length === 0) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    // Check if already in collection
    const existingCheck = await query(
      "SELECT id FROM collection_items WHERE collection_id = ? AND question_id = ?",
      [collectionId, question_id]
    );

    if (existingCheck.rows && existingCheck.rows.length > 0) {
      return NextResponse.json(
        { error: "Question already in collection" },
        { status: 400 }
      );
    }

    // Add to collection
    await query(
      "INSERT INTO collection_items (collection_id, question_id, note) VALUES (?, ?, ?)",
      [collectionId, question_id, note || null]
    );

    // Update collection's updated_at timestamp
    await query(
      "UPDATE collections SET updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [collectionId]
    );

    return NextResponse.json({
      message: "Question added to collection",
    });
  } catch (error) {
    console.error("Error adding to collection:", error);
    return NextResponse.json(
      { error: "Failed to add question to collection" },
      { status: 500 }
    );
  }
}

// DELETE /api/collections/[id]/items - Remove question from collection
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
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
    const collectionId = parseInt(params.id);
    const { question_id } = await req.json();

    if (isNaN(collectionId) || isNaN(question_id)) {
      return NextResponse.json(
        { error: "Invalid collection or question ID" },
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

    // Remove from collection
    await query(
      "DELETE FROM collection_items WHERE collection_id = ? AND question_id = ?",
      [collectionId, question_id]
    );

    // Update collection's updated_at timestamp
    await query(
      "UPDATE collections SET updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [collectionId]
    );

    return NextResponse.json({
      message: "Question removed from collection",
    });
  } catch (error) {
    console.error("Error removing from collection:", error);
    return NextResponse.json(
      { error: "Failed to remove question from collection" },
      { status: 500 }
    );
  }
}
