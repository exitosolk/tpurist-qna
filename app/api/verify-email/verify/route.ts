import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { logReputationChange } from "@/lib/reputation";
import { checkAyubowanBadge } from "@/lib/badges";

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
    const userResult = await query(
      "SELECT id, email, email_verified, verification_token_expires, reputation, email_verification_bonus_awarded FROM users WHERE verification_token = ?",
      [token]
    );

    if (!userResult.rows || userResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Invalid verification token" },
        { status: 400 }
      );
    }

    const user = userResult.rows[0];

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

    // Only award points if this is the first time they verify an email
    const VERIFICATION_POINTS = 10;
    const shouldAwardPoints = !user.email_verification_bonus_awarded;
    const pointsToAdd = shouldAwardPoints ? VERIFICATION_POINTS : 0;

    // Mark email as verified, clear token, and award points only on first verification
    await query(
      `UPDATE users 
       SET email_verified = TRUE, 
           verification_token = NULL, 
           verification_token_expires = NULL,
           reputation = reputation + ?,
           email_verification_bonus_awarded = TRUE
       WHERE id = ?`,
      [pointsToAdd, user.id]
    );

    // Log reputation gain if points were awarded
    if (shouldAwardPoints) {
      await logReputationChange({
        userId: user.id,
        changeAmount: VERIFICATION_POINTS,
        reason: "Email verified",
        referenceType: 'email_verification',
      });
    }

    // Check for Ayubowan badge (email verified + profile filled)
    await checkAyubowanBadge(user.id);

    return NextResponse.json({
      message: shouldAwardPoints 
        ? "Email verified successfully!" 
        : "Email verified successfully! (Bonus already claimed)",
      pointsEarned: pointsToAdd,
      newReputation: user.reputation + pointsToAdd,
      firstTimeVerification: shouldAwardPoints,
    });
  } catch (error) {
    console.error("Error verifying email:", error);
    return NextResponse.json(
      { error: "Failed to verify email" },
      { status: 500 }
    );
  }
}
