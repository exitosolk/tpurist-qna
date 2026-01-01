import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

// POST - Follow/Unfollow a tag
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
    const { tagName } = body;

    if (!tagName) {
      return NextResponse.json(
        { error: "Tag name is required" },
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
      `SELECT * FROM tag_follows 
       WHERE user_id = ? AND tag_name = ?`,
      [userId, tagName]
    );

    if (existingFollow.rows.length > 0) {
      // Unfollow
      await query(
        `DELETE FROM tag_follows 
         WHERE user_id = ? AND tag_name = ?`,
        [userId, tagName]
      );

      return NextResponse.json({ 
        message: "Unfollowed tag successfully",
        isFollowing: false
      });
    } else {
      // Follow
      await query(
        `INSERT INTO tag_follows (user_id, tag_name) 
         VALUES (?, ?)`,
        [userId, tagName]
      );

      return NextResponse.json({ 
        message: "Following tag successfully",
        isFollowing: true
      }, { status: 201 });
    }
  } catch (error) {
    console.error("Error toggling tag follow:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - Get all tags the user is following
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
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

    // Get all followed tags with question counts
    const followedTags = await query(
      `SELECT 
        tf.id as follow_id,
        tf.tag_name,
        tf.created_at as followed_at,
        COUNT(DISTINCT qt.question_id) as question_count
       FROM tag_follows tf
       LEFT JOIN question_tags qt ON tf.tag_name = qt.tag
       WHERE tf.user_id = ?
       GROUP BY tf.id, tf.tag_name, tf.created_at
       ORDER BY tf.created_at DESC`,
      [userId]
    );

    return NextResponse.json({
      followedTags: followedTags.rows
    });
  } catch (error) {
    console.error("Error fetching followed tags:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
