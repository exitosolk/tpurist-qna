import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface Params {
  slug: string;
}

// POST /api/collectives/[slug]/join - Join or leave a collective
export async function POST(
  req: NextRequest,
  context: { params: Promise<Params> }
) {
  try {
    const { slug } = await context.params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

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

    // Get collective
    const collectiveResult = await query(
      "SELECT id FROM collectives WHERE slug = ?",
      [slug]
    );

    if (!collectiveResult.rows || collectiveResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Collective not found" },
        { status: 404 }
      );
    }

    const collectiveId = collectiveResult.rows[0].id;

    // Check if already a member
    const membershipResult = await query(
      "SELECT id FROM collective_members WHERE collective_id = ? AND user_id = ?",
      [collectiveId, userId]
    );

    if (membershipResult.rows && membershipResult.rows.length > 0) {
      // Already a member, so leave
      await query(
        "DELETE FROM collective_members WHERE collective_id = ? AND user_id = ?",
        [collectiveId, userId]
      );

      // Decrement member count
      await query(
        "UPDATE collectives SET member_count = GREATEST(0, member_count - 1) WHERE id = ?",
        [collectiveId]
      );

      return NextResponse.json({
        message: "Left collective successfully",
        isMember: false,
      });
    } else {
      // Not a member, so join
      await query(
        "INSERT INTO collective_members (collective_id, user_id) VALUES (?, ?)",
        [collectiveId, userId]
      );

      // Increment member count
      await query(
        "UPDATE collectives SET member_count = member_count + 1 WHERE id = ?",
        [collectiveId]
      );

      return NextResponse.json({
        message: "Joined collective successfully",
        isMember: true,
      });
    }
  } catch (error) {
    console.error("Error toggling collective membership:", error);
    return NextResponse.json(
      { error: "Failed to update membership" },
      { status: 500 }
    );
  }
}
