import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { query } from "@/lib/db";

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { display_name, bio } = body;

    // Validate input
    if (display_name && display_name.trim().length === 0) {
      return NextResponse.json(
        { error: "Display name cannot be empty" },
        { status: 400 }
      );
    }

    if (display_name && display_name.length > 100) {
      return NextResponse.json(
        { error: "Display name must be less than 100 characters" },
        { status: 400 }
      );
    }

    if (bio && bio.length > 1000) {
      return NextResponse.json(
        { error: "Bio must be less than 1000 characters" },
        { status: 400 }
      );
    }

    // Get user ID
    const userResult = await query(
      "SELECT id FROM users WHERE email = ?",
      [session.user.email]
    );

    if (!userResult.rows || userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = userResult.rows[0].id;

    // Build update query dynamically based on provided fields
    const updates: string[] = [];
    const values: any[] = [];

    if (display_name !== undefined) {
      updates.push("display_name = ?");
      values.push(display_name);
    }

    if (bio !== undefined) {
      updates.push("bio = ?");
      values.push(bio);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    values.push(userId);

    await query(
      `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
      values
    );

    // Fetch updated user
    const updatedUserResult = await query(
      "SELECT id, username, email, display_name, bio, reputation, email_verified, created_at FROM users WHERE id = ?",
      [userId]
    );

    return NextResponse.json({
      message: "Profile updated successfully",
      user: updatedUserResult.rows[0],
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
