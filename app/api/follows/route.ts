import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

// POST - Follow/Unfollow an answer or question
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { followableType, followableId } = body;

    if (!["question", "answer"].includes(followableType)) {
      return NextResponse.json(
        { error: "Invalid followable type" },
        { status: 400 }
      );
    }

    // Get user ID
    const userResult = await query(
      "SELECT id FROM users WHERE email = ?",
      [session.user.email]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const userId = userResult.rows[0].id;

    // Check if already following
    const existingFollow = await query(
      `SELECT * FROM follows 
       WHERE user_id = ? AND followable_type = ? AND followable_id = ?`,
      [userId, followableType, followableId]
    );

    if (existingFollow.rows.length > 0) {
      // Unfollow
      await query(
        `DELETE FROM follows 
         WHERE user_id = ? AND followable_type = ? AND followable_id = ?`,
        [userId, followableType, followableId]
      );

      return NextResponse.json({ 
        message: "Unfollowed successfully",
        isFollowing: false
      });
    } else {
      // Follow
      await query(
        `INSERT INTO follows (user_id, followable_type, followable_id) 
         VALUES (?, ?, ?)`,
        [userId, followableType, followableId]
      );

      return NextResponse.json({ 
        message: "Following successfully",
        isFollowing: true
      }, { status: 201 });
    }
  } catch (error) {
    console.error("Error toggling follow:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - Get user's followed items
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const followableType = searchParams.get("type");
    const followableIds = searchParams.get("ids");

    // Get user ID
    const userResult = await query(
      "SELECT id FROM users WHERE email = ?",
      [session.user.email]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const userId = userResult.rows[0].id;

    // If checking specific IDs
    if (followableType && followableIds) {
      const ids = followableIds.split(",").map(id => parseInt(id));
      const placeholders = ids.map(() => "?").join(",");
      
      const result = await query(
        `SELECT followable_id FROM follows 
         WHERE user_id = ? AND followable_type = ? AND followable_id IN (${placeholders})`,
        [userId, followableType, ...ids]
      );

      const followedIds = result.rows.map(row => row.followable_id);
      return NextResponse.json({ followedIds });
    }

    // Get all followed items with details
    const result = await query(
      `SELECT 
        f.followable_type,
        f.followable_id,
        f.created_at as followed_at,
        CASE 
          WHEN f.followable_type = 'question' THEN q.title
          WHEN f.followable_type = 'answer' THEN qq.title
        END as question_title,
        CASE 
          WHEN f.followable_type = 'question' THEN q.slug
          WHEN f.followable_type = 'answer' THEN qq.slug
        END as question_slug,
        CASE 
          WHEN f.followable_type = 'question' THEN q.id
          WHEN f.followable_type = 'answer' THEN a.question_id
        END as question_id
       FROM follows f
       LEFT JOIN questions q ON f.followable_type = 'question' AND f.followable_id = q.id
       LEFT JOIN answers a ON f.followable_type = 'answer' AND f.followable_id = a.id
       LEFT JOIN questions qq ON f.followable_type = 'answer' AND a.question_id = qq.id
       WHERE f.user_id = ?
       ORDER BY f.created_at DESC`,
      [userId]
    );

    return NextResponse.json({ follows: result.rows });
  } catch (error) {
    console.error("Error fetching follows:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
