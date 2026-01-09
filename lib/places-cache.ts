import { query } from "@/lib/db";
import crypto from "crypto";

interface CacheOptions {
  ttl?: number; // Time to live in seconds (default: 300 = 5 minutes)
}

export async function logPlacesAPIUsage(
  endpoint: string,
  cacheHit: boolean,
  searchTerm?: string,
  placeId?: string,
  responseTime?: number
) {
  try {
    await query(
      `INSERT INTO places_api_analytics 
       (endpoint, cache_hit, search_term, place_id, response_time_ms)
       VALUES (?, ?, ?, ?, ?)`,
      [endpoint, cacheHit, searchTerm || null, placeId || null, responseTime || null]
    );
  } catch (error) {
    console.error("Failed to log API usage:", error);
  }
}

export async function getMapQueryCache(
  bounds: { minLat: number; minLng: number; maxLat: number; maxLng: number },
  tag?: string
): Promise<any[] | null> {
  try {
    const queryHash = generateQueryHash({ bounds, tag });

    const result = await query(
      `SELECT question_ids, result_count, expires_at 
       FROM map_query_cache 
       WHERE query_hash = ? AND expires_at > NOW()`,
      [queryHash]
    );

    if (result.rows && result.rows.length > 0) {
      // Update hit count asynchronously
      query(
        `UPDATE map_query_cache SET hit_count = hit_count + 1 WHERE query_hash = ?`,
        [queryHash]
      ).catch(console.error);

      const cached = result.rows[0];
      return JSON.parse(cached.question_ids);
    }

    return null;
  } catch (error) {
    console.error("Error reading map query cache:", error);
    return null;
  }
}

export async function setMapQueryCache(
  bounds: { minLat: number; minLng: number; maxLat: number; maxLng: number },
  questions: any[],
  tag?: string,
  options: CacheOptions = {}
): Promise<void> {
  try {
    const queryHash = generateQueryHash({ bounds, tag });
    const ttl = options.ttl || 300; // 5 minutes default
    const questionIds = JSON.stringify(questions.map((q) => q.id));

    await query(
      `INSERT INTO map_query_cache 
       (query_hash, bounds_minlat, bounds_minlng, bounds_maxlat, bounds_maxlng, tag, result_count, question_ids, expires_at, hit_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? SECOND), 1)
       ON DUPLICATE KEY UPDATE
         question_ids = VALUES(question_ids),
         result_count = VALUES(result_count),
         expires_at = DATE_ADD(NOW(), INTERVAL ? SECOND),
         hit_count = hit_count + 1`,
      [
        queryHash,
        bounds.minLat,
        bounds.minLng,
        bounds.maxLat,
        bounds.maxLng,
        tag || null,
        questions.length,
        questionIds,
        ttl,
        ttl,
      ]
    );
  } catch (error) {
    console.error("Error setting map query cache:", error);
  }
}

function generateQueryHash(params: {
  bounds: { minLat: number; minLng: number; maxLat: number; maxLng: number };
  tag?: string;
}): string {
  // Round coordinates to 4 decimal places for cache key
  const normalized = {
    minLat: params.bounds.minLat.toFixed(4),
    minLng: params.bounds.minLng.toFixed(4),
    maxLat: params.bounds.maxLat.toFixed(4),
    maxLng: params.bounds.maxLng.toFixed(4),
    tag: params.tag || "",
  };

  const hashString = JSON.stringify(normalized);
  return crypto.createHash("md5").update(hashString).digest("hex");
}

export async function cleanExpiredCaches(): Promise<void> {
  try {
    await query(`DELETE FROM map_query_cache WHERE expires_at < NOW()`);
  } catch (error) {
    console.error("Error cleaning expired caches:", error);
  }
}

// Get cache statistics
export async function getCacheStats() {
  try {
    const placesStats = await query(`
      SELECT 
        COUNT(*) as total_places,
        SUM(hit_count) as total_hits,
        AVG(hit_count) as avg_hits
      FROM places_cache
    `);

    const apiStats = await query(`
      SELECT 
        endpoint,
        COUNT(*) as total_calls,
        SUM(CASE WHEN cache_hit THEN 1 ELSE 0 END) as cache_hits,
        ROUND(SUM(CASE WHEN cache_hit THEN 1 ELSE 0 END) / COUNT(*) * 100, 2) as cache_hit_rate,
        AVG(response_time_ms) as avg_response_time
      FROM places_api_analytics
      WHERE created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
      GROUP BY endpoint
    `);

    const mapCacheStats = await query(`
      SELECT 
        COUNT(*) as total_queries,
        SUM(hit_count) as total_hits,
        SUM(result_count) as total_results
      FROM map_query_cache
      WHERE expires_at > NOW()
    `);

    return {
      places: placesStats.rows[0] || {},
      api: apiStats.rows || [],
      mapCache: mapCacheStats.rows[0] || {},
    };
  } catch (error) {
    console.error("Error getting cache stats:", error);
    return null;
  }
}
