import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { generateSlug } from "@/lib/slug";

// GET /api/collections - List user's collections
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);

    const result = await query(
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
      WHERE c.user_id = ?
      GROUP BY c.id, c.name, c.description, c.slug, c.is_public, c.created_at, c.updated_at
      ORDER BY c.updated_at DESC`,
      [userId]
    );

    return NextResponse.json({ collections: result.rows || [] });
  } catch (error) {
    console.error("Error fetching collections:", error);
    return NextResponse.json(
      { error: "Failed to fetch collections" },
      { status: 500 }
    );
  }
}

// POST /api/collections - Create new collection
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);
    const { name, description, is_public } = await req.json();

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Collection name is required" },
        { status: 400 }
      );
    }

    if (name.length > 255) {
      return NextResponse.json(
        { error: "Collection name is too long (max 255 characters)" },
        { status: 400 }
      );
    }

    // Generate unique slug
    const baseSlug = generateSlug(name);
    let slug = baseSlug;
    let counter = 1;

    // Check if slug exists for this user
    while (true) {
      const existing = await query(
        "SELECT id FROM collections WHERE user_id = ? AND slug = ?",
        [userId, slug]
      );

      if (!existing.rows || existing.rows.length === 0) {
        break;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create collection
    const result = await query(
      `INSERT INTO collections (user_id, name, description, slug, is_public)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, name.trim(), description || null, slug, is_public || false]
    );

    // Fetch the created collection
    const created = await query(
      `SELECT 
        id, name, description, slug, is_public, created_at, updated_at, 0 as item_count
      FROM collections 
      WHERE id = ?`,
      [result.insertId]
    );

    return NextResponse.json({
      message: "Collection created successfully",
      collection: created.rows?.[0],
    });
  } catch (error) {
    console.error("Error creating collection:", error);
    return NextResponse.json(
      { error: "Failed to create collection" },
      { status: 500 }
    );
  }
}
