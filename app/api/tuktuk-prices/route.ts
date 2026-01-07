import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import crypto from "crypto";

// Sri Lankan TukTuk Fair Pricing Structure
const TUKTUK_PRICING = {
  FIRST_KM_MIN: 100,
  FIRST_KM_MAX: 120,
  ADDITIONAL_KM_MIN: 80,
  ADDITIONAL_KM_MAX: 100,
};

// Calculate fair price based on distance
function calculateFairPrice(distanceKm: number) {
  if (!distanceKm || distanceKm <= 0) return null;
  
  const firstKmPrice = (TUKTUK_PRICING.FIRST_KM_MIN + TUKTUK_PRICING.FIRST_KM_MAX) / 2; // 110
  const additionalKmPrice = (TUKTUK_PRICING.ADDITIONAL_KM_MIN + TUKTUK_PRICING.ADDITIONAL_KM_MAX) / 2; // 90
  
  if (distanceKm <= 1) {
    return {
      min: TUKTUK_PRICING.FIRST_KM_MIN * distanceKm,
      max: TUKTUK_PRICING.FIRST_KM_MAX * distanceKm,
      fair: firstKmPrice * distanceKm,
    };
  }
  
  const firstKm = firstKmPrice;
  const remainingKm = distanceKm - 1;
  const additionalCost = remainingKm * additionalKmPrice;
  
  return {
    min: TUKTUK_PRICING.FIRST_KM_MIN + (remainingKm * TUKTUK_PRICING.ADDITIONAL_KM_MIN),
    max: TUKTUK_PRICING.FIRST_KM_MAX + (remainingKm * TUKTUK_PRICING.ADDITIONAL_KM_MAX),
    fair: firstKm + additionalCost,
  };
}

// POST /api/tuktuk-prices - Submit a new tuktuk price report (supports anonymous)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const {
      start_location,
      end_location,
      price,
      date_of_travel,
      additional_notes,
      start_place_id,
      end_place_id,
      distance_km,
    } = body;

    if (!start_location || !end_location || !price || !date_of_travel) {
      return NextResponse.json(
        { error: "Start location, end location, price, and date are required" },
        { status: 400 }
      );
    }

    let userId = null;
    let isAnonymous = true;
    let anonymousSession = null;
    let ipHash = null;

    // If user is logged in, use their ID
    if (session?.user?.email) {
      const userResult = await query(
        "SELECT id FROM users WHERE email = ?",
        [session.user.email]
      );

      if (userResult.rows && userResult.rows.length > 0) {
        userId = userResult.rows[0].id;
        isAnonymous = false;
      }
    } else {
      // Anonymous user - create session identifier
      const userAgent = req.headers.get("user-agent") || "";
      const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
      
      // Hash IP for privacy
      ipHash = crypto.createHash("sha256").update(ip).digest("hex");
      
      // Create anonymous session token
      anonymousSession = crypto.randomBytes(16).toString("hex");
    }

    // Calculate price per km if distance provided
    const pricePerKm = distance_km ? price / distance_km : null;

    // Insert tuktuk price report
    await query(
      `INSERT INTO tuktuk_prices (
        user_id, is_anonymous, anonymous_session, ip_hash,
        start_location, start_place_id, end_location, end_place_id,
        price, distance_km, price_per_km, date_of_travel, additional_notes
      ) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        isAnonymous,
        anonymousSession,
        ipHash,
        start_location.trim(),
        start_place_id,
        end_location.trim(),
        end_place_id,
        price,
        distance_km,
        pricePerKm,
        date_of_travel,
        additional_notes || null,
      ]
    );

    return NextResponse.json({
      message: "TukTuk price reported successfully",
      session: anonymousSession,
    });
  } catch (error) {
    console.error("Error reporting tuktuk price:", error);
    return NextResponse.json(
      { error: "Failed to report tuktuk price" },
      { status: 500 }
    );
  }
}

// GET /api/tuktuk-prices - Get average prices for routes and statistics
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    const limit = parseInt(searchParams.get("limit") || "10");
    const type = searchParams.get("type"); // 'recent' for live pulse

    // Get recent reports for "Live Pulse" section
    if (type === "recent") {
      const recentResult = await query(
        `SELECT 
          t.start_location,
          t.end_location,
          t.price,
          t.distance_km,
          t.price_per_km,
          t.created_at,
          t.date_of_travel
        FROM tuktuk_prices t
        WHERE t.date_of_travel >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        ORDER BY t.created_at DESC
        LIMIT ?`,
        [limit]
      );

      return NextResponse.json({
        recent_reports: recentResult.rows || [],
      });
    }

    // Get per-km average rate
    if (type === "per-km") {
      const perKmResult = await query(
        `SELECT 
          AVG(price_per_km) as avg_per_km,
          MIN(price_per_km) as min_per_km,
          MAX(price_per_km) as max_per_km,
          COUNT(*) as total_reports
        FROM tuktuk_prices 
        WHERE price_per_km IS NOT NULL 
        AND price_per_km > 0
        AND date_of_travel >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)`
      );

      return NextResponse.json({
        per_km_rate: perKmResult.rows[0] || null,
      });
    }

    if (start && end) {
      // Get specific route data with enhanced statistics
      const result = await query(
        `SELECT 
          start_location,
          end_location,
          AVG(price) as avg_price,
          MIN(price) as min_price,
          MAX(price) as max_price,
          AVG(distance_km) as avg_distance,
          AVG(price_per_km) as avg_per_km,
          COUNT(*) as report_count,
          MAX(date_of_travel) as last_reported,
          COUNT(CASE WHEN date_of_travel >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 END) as reports_last_week
        FROM tuktuk_prices 
        WHERE (
          (LOWER(start_location) = LOWER(?) AND LOWER(end_location) = LOWER(?))
          OR (start_place_id = ? AND end_place_id = ?)
        )
        AND date_of_travel >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
        GROUP BY start_location, end_location`,
        [start, end, start, end]
      );

      // Get recent individual reports for this route
      const recentReports = await query(
        `SELECT 
          price, 
          distance_km,
          price_per_km,
          date_of_travel, 
          additional_notes, 
          created_at,
          is_anonymous
         FROM tuktuk_prices 
         WHERE (
           (LOWER(start_location) = LOWER(?) AND LOWER(end_location) = LOWER(?))
           OR (start_place_id = ? AND end_place_id = ?)
         )
         ORDER BY date_of_travel DESC, created_at DESC
         LIMIT 10`,
        [start, end, start, end]
      );

      const routeData = result.rows[0] || null;
      
      // Calculate fair price based on average distance
      let fairPricing = null;
      if (routeData && routeData.avg_distance) {
        fairPricing = calculateFairPrice(Number(routeData.avg_distance));
      }

      return NextResponse.json({
        route: routeData,
        fair_pricing: fairPricing,
        recent_reports: recentReports.rows || [],
      });
    } else {
      // Get popular routes with average prices
      const result = await query(
        `SELECT 
          start_location,
          end_location,
          AVG(price) as avg_price,
          MIN(price) as min_price,
          MAX(price) as max_price,
          AVG(distance_km) as avg_distance,
          COUNT(*) as report_count,
          MAX(date_of_travel) as last_reported
        FROM tuktuk_prices 
        WHERE date_of_travel >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
        GROUP BY start_location, end_location
        HAVING COUNT(*) >= 3
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
