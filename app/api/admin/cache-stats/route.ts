import { NextResponse } from "next/server";
import { getCacheStats } from "@/lib/places-cache";
import { query } from "@/lib/db";

// GET /api/admin/cache-stats - View cache performance statistics
export async function GET() {
  try {
    const stats = await getCacheStats();

    // Calculate API cost savings
    const apiCostPerAutocomplete = 0.00283; // USD per request
    const apiCostPerDetails = 0.017; // USD per request

    const autocompleteStats = stats?.api.find((s: any) => s.endpoint === 'autocomplete');
    const detailsStats = stats?.api.find((s: any) => s.endpoint === 'details');

    const estimatedSavings = {
      autocomplete: autocompleteStats ? (autocompleteStats.cache_hits * apiCostPerAutocomplete).toFixed(2) : '0.00',
      details: detailsStats ? (detailsStats.cache_hits * apiCostPerDetails).toFixed(2) : '0.00',
      total: '0.00',
    };
    estimatedSavings.total = (parseFloat(estimatedSavings.autocomplete) + parseFloat(estimatedSavings.details)).toFixed(2);

    // Get top cached places
    const topPlaces = await query(`
      SELECT name, formatted_address, hit_count, last_used_at
      FROM places_cache
      ORDER BY hit_count DESC
      LIMIT 20
    `);

    // Recent API usage
    const recentUsage = await query(`
      SELECT 
        endpoint,
        cache_hit,
        search_term,
        response_time_ms,
        created_at
      FROM places_api_analytics
      ORDER BY created_at DESC
      LIMIT 50
    `);

    return NextResponse.json({
      stats,
      estimatedSavings,
      topPlaces: topPlaces.rows,
      recentUsage: recentUsage.rows,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching cache stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch cache statistics" },
      { status: 500 }
    );
  }
}
