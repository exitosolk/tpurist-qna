import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET /api/locations/stats - Get question counts for popular locations
export async function GET(req: Request) {
  try {
    const locations = [
      "colombo", "kandy", "galle", "ella", "sigiriya", "mirissa",
      "unawatuna", "arugam bay", "hikkaduwa", "nuwara eliya",
      "haputale", "adams peak", "polonnaruwa", "anuradhapura"
    ];

    const stats = await Promise.all(
      locations.map(async (location) => {
        const result = await query(
          `SELECT COUNT(*) as count
           FROM questions q
           WHERE EXISTS (
             SELECT 1 FROM question_tags qt 
             JOIN tags t ON qt.tag_id = t.id 
             WHERE qt.question_id = q.id AND t.name = ?
           )`,
          [location]
        );

        return {
          name: location,
          count: result.rows[0]?.count || 0,
        };
      })
    );

    return NextResponse.json({ locations: stats });
  } catch (error) {
    console.error("Error fetching location stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch location stats" },
      { status: 500 }
    );
  }
}
