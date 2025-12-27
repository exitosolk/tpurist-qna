import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/notifications - Get user's notifications
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get("unread") === "true";
    const limit = parseInt(searchParams.get("limit") || "20");

    // Get user ID
    const userResult = await query(
      "SELECT id FROM users WHERE email = ?",
      [session.user.email]
    );

    if (!userResult.rows || userResult.rows.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const userId = userResult.rows[0].id;

    // Build query
    let notificationQuery = `
      SELECT 
        n.id,
        n.type,
        n.message,
        n.is_read,
        n.created_at,
        n.question_id,
        n.answer_id,
        u.username as actor_username,
        u.display_name as actor_display_name
      FROM notifications n
      LEFT JOIN users u ON n.actor_id = u.id
      WHERE n.user_id = ?
    `;

    if (unreadOnly) {
      notificationQuery += " AND n.is_read = FALSE";
    }

    notificationQuery += " ORDER BY n.created_at DESC LIMIT ?";

    const result = await query(notificationQuery, [userId, limit]);

    // Get unread count
    const unreadResult = await query(
      "SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE",
      [userId]
    );

    return NextResponse.json({
      notifications: result.rows || [],
      unread_count: unreadResult.rows?.[0]?.count || 0,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

// PATCH /api/notifications - Mark notifications as read
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { notification_ids, mark_all } = body;

    // Get user ID
    const userResult = await query(
      "SELECT id FROM users WHERE email = ?",
      [session.user.email]
    );

    if (!userResult.rows || userResult.rows.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const userId = userResult.rows[0].id;

    if (mark_all) {
      // Mark all notifications as read
      await query(
        "UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE",
        [userId]
      );
    } else if (notification_ids && Array.isArray(notification_ids)) {
      // Mark specific notifications as read
      if (notification_ids.length > 0) {
        const placeholders = notification_ids.map(() => "?").join(",");
        await query(
          `UPDATE notifications SET is_read = TRUE WHERE id IN (${placeholders}) AND user_id = ?`,
          [...notification_ids, userId]
        );
      }
    }

    return NextResponse.json({
      message: "Notifications marked as read",
    });
  } catch (error) {
    console.error("Error updating notifications:", error);
    return NextResponse.json(
      { error: "Failed to update notifications" },
      { status: 500 }
    );
  }
}
