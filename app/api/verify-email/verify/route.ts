import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Verification token is required" },
        { status: 400 }
      );
    }

    // Find user with this token
    const users = await query(
      "SELECT id, email, email_verified, verification_token_expires, reputation FROM users WHERE verification_token = ?",
      [token]
    );

    if (!users || users.length === 0) {
      return NextResponse.json(
        { error: "Invalid verification token" },
        { status: 400 }
      );
    }

    const user = users[0];

    // Check if already verified
    if (user.email_verified) {
      return NextResponse.json(
        { message: "Email is already verified", alreadyVerified: true },
        { status: 200 }
      );
    }

    // Check if token is expired
    if (new Date(user.verification_token_expires) < new Date()) {
      return NextResponse.json(
        { error: "Verification token has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Mark email as verified, clear token, and add 10 reputation points
    const VERIFICATION_POINTS = 10;
    await query(
      `UPDATE users 
       SET email_verified = TRUE, 
           verification_token = NULL, 
           verification_token_expires = NULL,
           reputation = reputation + ?
       WHERE id = ?`,
      [VERIFICATION_POINTS, user.id]
    );

    return NextResponse.json({
      message: "Email verified successfully!",
      pointsEarned: VERIFICATION_POINTS,
      newReputation: user.reputation + VERIFICATION_POINTS,
    });
  } catch (error) {
    console.error("Error verifying email:", error);
    return NextResponse.json(
      { error: "Failed to verify email" },
      { status: 500 }
    );
  }
}
