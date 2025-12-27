import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";

// GET /api/settings - Get user settings
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const result = await query(
      `SELECT id, username, email, display_name, bio, email_verified, created_at 
       FROM users WHERE email = ?`,
      [session.user.email]
    );

    if (!result.rows || result.rows.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user: result.rows[0] });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// PATCH /api/settings - Update user settings
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
    const { email, current_password, new_password } = body;

    // Get user ID
    const userResult = await query(
      "SELECT id, email, password FROM users WHERE email = ?",
      [session.user.email]
    );

    if (!userResult.rows || userResult.rows.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const user = userResult.rows[0];

    // Handle email update
    if (email && email !== session.user.email) {
      // Check if new email is already taken
      const emailCheck = await query(
        "SELECT id FROM users WHERE email = ? AND id != ?",
        [email, user.id]
      );

      if (emailCheck.rows && emailCheck.rows.length > 0) {
        return NextResponse.json(
          { error: "Email address is already in use" },
          { status: 400 }
        );
      }

      // Update email and mark as unverified
      await query(
        `UPDATE users 
         SET email = ?, email_verified = FALSE 
         WHERE id = ?`,
        [email, user.id]
      );
    }

    // Handle password change
    if (new_password) {
      if (!current_password) {
        return NextResponse.json(
          { error: "Current password is required to change password" },
          { status: 400 }
        );
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(current_password, user.password);
      if (!isValidPassword) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 }
        );
      }

      // Hash and update new password
      const hashedPassword = await bcrypt.hash(new_password, 10);
      await query(
        "UPDATE users SET password = ? WHERE id = ?",
        [hashedPassword, user.id]
      );
    }

    return NextResponse.json({
      message: "Settings updated successfully",
      email_changed: email && email !== session.user.email,
      password_changed: !!new_password
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
