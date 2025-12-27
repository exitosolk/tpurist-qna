import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// POST /api/tuktuk-prices - Submit a new tuktuk price report
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
    const { start_location, end_location, price, date_of_travel, additional_notes } = body;

    if (!start_location || !end_location || !price || !date_of_travel) {
      return NextResponse.json(
        { error: "Start location, end location, price, and date are required" },
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

    // Insert tuktuk price report
    await query(
      `INSERT INTO tuktuk_prices (user_id, start_location, end_location, price, date_of_travel, additional_notes) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, start_location.trim(), end_location.trim(), price, date_of_travel, additional_notes || null]
    );

    return NextResponse.json({
      message: "TukTuk price reported successfully",
    });
  } catch (error) {
    console.error("Error reporting tuktuk price:", error);
    return NextResponse.json(
      { error: "Failed to report tuktuk price" },
      { status: 500 }
    );
  }
}

// GET /api/tuktuk-prices - Get average prices for routes
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    const limit = parseInt(searchParams.get("limit") || "10");

    if (start && end) {
      // Get specific route data with history
      const result = await query(
        `SELECT 
          start_location,
          end_location,
          AVG(price) as avg_price,
          MIN(price) as min_price,
          MAX(price) as max_price,
          COUNT(*) as report_count,
          MAX(date_of_travel) as last_reported
        FROM tuktuk_prices 
        WHERE LOWER(start_location) = LOWER(?) AND LOWER(end_location) = LOWER(?)
        AND date_of_travel >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
        GROUP BY start_location, end_location`,
        [start, end]
      );

      // Get recent individual reports for this route
      const recentReports = await query(
        `SELECT price, date_of_travel, additional_notes, created_at
         FROM tuktuk_prices 
         WHERE LOWER(start_location) = LOWER(?) AND LOWER(end_location) = LOWER(?)
         ORDER BY date_of_travel DESC, created_at DESC
         LIMIT 10`,
        [start, end]
      );

      return NextResponse.json({
        route: result.rows[0] || null,
        recent_reports: recentReports.rows || [],
      });
    } else {
      // Get popular routes with average prices
      const result = await query(
        `SELECT 
          start_location,
          end_location,
          AVG(price) as avg_price,
          COUNT(*) as report_count,
          MAX(date_of_travel) as last_reported
        FROM tuktuk_prices 
        WHERE date_of_travel >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
        GROUP BY start_location, end_location
        HAVING COUNT(*) >= 1
        ORDER BY report_count DESC, last_reported DESC
        LIMIT ?`,
        [limit]
      );

      return NextResponse.json({
        popular_routes: result.rows || [],
      });
    }
  } catch (error) {
    console.error("Error fetching tuktuk prices:", error);
    return NextResponse.json(
      { error: "Failed to fetch tuktuk prices" },
      { status: 500 }
    );
  }
}
