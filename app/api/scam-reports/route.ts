import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/scam-reports?tag=tagname - Get scam reports for a specific tag
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tag = searchParams.get("tag");
    const limit = parseInt(searchParams.get("limit") || "5");

    if (!tag) {
      return NextResponse.json(
        { error: "Tag parameter is required" },
        { status: 400 }
      );
    }

    const result = await query(
      `SELECT 
        sr.id,
        sr.tag,
        sr.title,
        sr.description,
        sr.severity,
        sr.upvotes,
        sr.verified,
        sr.created_at,
        u.username as reported_by_username
      FROM scam_reports sr
      LEFT JOIN users u ON sr.reported_by = u.id
      WHERE LOWER(sr.tag) = LOWER(?)
      ORDER BY sr.verified DESC, sr.upvotes DESC, sr.created_at DESC
      LIMIT ?`,
      [tag, limit]
    );

    return NextResponse.json({
      scams: result.rows || [],
    });
  } catch (error) {
    console.error("Error fetching scam reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch scam reports" },
      { status: 500 }
    );
  }
}

// POST /api/scam-reports - Submit a new scam report
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { tag, title, description, severity } = body;

    if (!tag || !title || !description) {
      return NextResponse.json(
        { error: "Tag, title, and description are required" },
        { status: 400 }
      );
    }

    // Validate severity
    const validSeverities = ["low", "medium", "high"];
    const scamSeverity = severity && validSeverities.includes(severity) ? severity : "medium";

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

    // Insert scam report
    await query(
      `INSERT INTO scam_reports (tag, title, description, severity, reported_by) 
       VALUES (?, ?, ?, ?, ?)`,
      [tag.trim(), title.trim(), description.trim(), scamSeverity, userId]
    );

    return NextResponse.json({
      message: "Scam report submitted successfully",
    });
  } catch (error) {
    console.error("Error submitting scam report:", error);
    return NextResponse.json(
      { error: "Failed to submit scam report" },
      { status: 500 }
    );
  }
}

// POST /api/scam-reports/upvote - Upvote a scam report
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
    const { scam_id } = body;

    if (!scam_id) {
      return NextResponse.json(
        { error: "Scam ID is required" },
        { status: 400 }
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

    // Check if user already voted
    const voteCheck = await query(
      "SELECT id FROM scam_report_votes WHERE scam_report_id = ? AND user_id = ?",
      [scam_id, userId]
    );

    if (voteCheck.rows && voteCheck.rows.length > 0) {
      // Remove vote (downvote)
      await query(
        "DELETE FROM scam_report_votes WHERE scam_report_id = ? AND user_id = ?",
        [scam_id, userId]
      );
      await query(
        "UPDATE scam_reports SET upvotes = upvotes - 1 WHERE id = ?",
        [scam_id]
      );
      return NextResponse.json({ message: "Vote removed", voted: false });
    } else {
      // Add vote (upvote)
      await query(
        "INSERT INTO scam_report_votes (scam_report_id, user_id) VALUES (?, ?)",
        [scam_id, userId]
      );
      await query(
        "UPDATE scam_reports SET upvotes = upvotes + 1 WHERE id = ?",
        [scam_id]
      );
      return NextResponse.json({ message: "Upvoted successfully", voted: true });
    }
  } catch (error) {
    console.error("Error voting on scam report:", error);
    return NextResponse.json(
      { error: "Failed to vote on scam report" },
      { status: 500 }
    );
  }
}
