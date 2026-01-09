import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getBadgeTierCounts } from "@/lib/badges";

// Haversine formula to calculate distance between two points
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// GET /api/questions/nearby - Get questions near a location
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const latitude = parseFloat(searchParams.get("latitude") || "0");
    const longitude = parseFloat(searchParams.get("longitude") || "0");
    const radius = parseFloat(searchParams.get("radius") || "50"); // km
    const tag = searchParams.get("tag");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: "Latitude and longitude are required" },
        { status: 400 }
      );
    }

    // Calculate bounding box for initial filter (much faster than calculating distance for all rows)
    // Approximate: 1 degree latitude ≈ 111 km, 1 degree longitude ≈ 111 km * cos(latitude)
    const latDelta = radius / 111;
    const lonDelta = radius / (111 * Math.cos(latitude * (Math.PI / 180)));

    const minLat = latitude - latDelta;
    const maxLat = latitude + latDelta;
    const minLon = longitude - lonDelta;
    const maxLon = longitude + lonDelta;

    // Build query with optional tag filter
    let queryText = `
      SELECT 
        q.*,
        u.username,
        u.display_name,
        u.avatar_url,
        u.reputation,
        q.latitude as q_latitude,
        q.longitude as q_longitude
      FROM questions q
      JOIN users u ON q.user_id = u.id
      WHERE q.latitude IS NOT NULL 
        AND q.longitude IS NOT NULL
        AND q.latitude BETWEEN ? AND ?
        AND q.longitude BETWEEN ? AND ?
    `;

    const params: any[] = [minLat, maxLat, minLon, maxLon];

    if (tag) {
      queryText += ` AND EXISTS (
        SELECT 1 FROM question_tags qt2 
        JOIN tags t2 ON qt2.tag_id = t2.id 
        WHERE qt2.question_id = q.id AND t2.name = ?
      )`;
      params.push(tag);
    }

    queryText += ` ORDER BY q.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit * 2, offset);

    // Query questions within bounding box
    const result = await query(queryText, params);

    // Calculate exact distance and filter
    const questionsWithDistance = result.rows
      .map((question: any) => {
        const distance = calculateDistance(
          latitude,
          longitude,
          Number(question.q_latitude),
          Number(question.q_longitude)
        );

        return {
          ...question,
          distance: Math.round(distance * 10) / 10, // Round to 1 decimal
        };
      })
      .filter((q: any) => q.distance <= radius)
      .sort((a: any, b: any) => a.distance - b.distance)
      .slice(0, limit);

    // Add tags, collectives, and badge counts
    const questionsWithExtras = await Promise.all(
      questionsWithDistance.map(async (question: any) => {
        // Get tags
        const tagsResult = await query(
          `SELECT t.id, t.name
           FROM question_tags qt
           JOIN tags t ON qt.tag_id = t.id
           WHERE qt.question_id = ?`,
          [question.id]
        );

        // Get collectives
        const collectivesResult = await query(
          `SELECT c.id, c.name, c.slug
           FROM collective_questions cq
           JOIN collectives c ON cq.collective_id = c.id
           WHERE cq.question_id = ?`,
          [question.id]
        );

        // Get badge counts
        const badgeCounts = await getBadgeTierCounts(question.user_id);

        return {
          ...question,
          tags: tagsResult.rows,
          collectives: collectivesResult.rows,
          badgeCounts,
        };
      })
    );

    return NextResponse.json({
      questions: questionsWithExtras,
      center: { latitude, longitude },
      radius,
      total: questionsWithExtras.length,
    });
  } catch (error) {
    console.error("Error fetching nearby questions:", error);
    return NextResponse.json(
      { error: "Failed to fetch nearby questions" },
      { status: 500 }
    );
  }
}
