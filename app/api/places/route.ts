import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

// Google Places API configuration
const GOOGLE_PLACES_API_KEY = "AIzaSyAyDWij1xYKmOV857_CM_dq6fG5lH2FxNM";

interface PlaceCache {
  place_id: string;
  name: string;
  formatted_address: string;
  lat: number | null;
  lng: number | null;
}

// GET /api/places/autocomplete - Search for places with caching
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const input = searchParams.get("input");
    const sessionToken = searchParams.get("sessiontoken");

    if (!input || input.length < 2) {
      return NextResponse.json({ predictions: [] });
    }

    // First, search our local cache using FULLTEXT search
    const cacheResults = await query(
      `SELECT place_id, name, formatted_address, lat, lng, hit_count
       FROM places_cache
       WHERE MATCH(name, formatted_address, search_terms) AGAINST(? IN NATURAL LANGUAGE MODE)
       OR name LIKE ? 
       OR formatted_address LIKE ?
       ORDER BY hit_count DESC, last_used_at DESC
       LIMIT 5`,
      [input, `%${input}%`, `%${input}%`]
    );

    if (cacheResults.rows && cacheResults.rows.length > 0) {
      // Return cached results first
      const predictions = cacheResults.rows.map((row: PlaceCache) => ({
        place_id: row.place_id,
        description: row.formatted_address,
        structured_formatting: {
          main_text: row.name,
          secondary_text: row.formatted_address,
        },
        fromCache: true,
      }));

      // Update hit counts asynchronously
      const placeIds = cacheResults.rows.map((r: PlaceCache) => r.place_id);
      if (placeIds.length > 0) {
        query(
          `UPDATE places_cache SET hit_count = hit_count + 1 WHERE place_id IN (${placeIds.map(() => '?').join(',')})`,
          placeIds
        ).catch(console.error);
      }

      return NextResponse.json({ predictions });
    }

    // If not in cache, fetch from Google Places API
    const url = new URL("https://maps.googleapis.com/maps/api/place/autocomplete/json");
    url.searchParams.set("input", input);
    url.searchParams.set("key", GOOGLE_PLACES_API_KEY);
    url.searchParams.set("components", "country:lk"); // Restrict to Sri Lanka
    if (sessionToken) {
      url.searchParams.set("sessiontoken", sessionToken);
    }

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status === "OK" && data.predictions) {
      // Cache the predictions asynchronously
      cachePredictions(data.predictions, input).catch(console.error);

      return NextResponse.json({
        predictions: data.predictions.map((p: any) => ({
          ...p,
          fromCache: false,
        })),
      });
    }

    return NextResponse.json({ predictions: [] });
  } catch (error) {
    console.error("Error in places autocomplete:", error);
    return NextResponse.json({ predictions: [] });
  }
}

// Cache predictions in our database
async function cachePredictions(predictions: any[], searchTerm: string) {
  for (const prediction of predictions) {
    try {
      // Fetch place details to get coordinates
      const detailsUrl = new URL("https://maps.googleapis.com/maps/api/place/details/json");
      detailsUrl.searchParams.set("place_id", prediction.place_id);
      detailsUrl.searchParams.set("key", GOOGLE_PLACES_API_KEY);
      detailsUrl.searchParams.set("fields", "name,formatted_address,geometry,address_components");

      const detailsResponse = await fetch(detailsUrl.toString());
      const detailsData = await detailsResponse.json();

      if (detailsData.status === "OK" && detailsData.result) {
        const place = detailsData.result;
        const locality = place.address_components?.find((c: any) =>
          c.types.includes("locality")
        )?.long_name;
        const country = place.address_components?.find((c: any) =>
          c.types.includes("country")
        )?.long_name;

        // Insert or update cache
        await query(
          `INSERT INTO places_cache 
           (place_id, name, formatted_address, lat, lng, search_terms, locality, country, hit_count)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
           ON DUPLICATE KEY UPDATE 
             name = VALUES(name),
             formatted_address = VALUES(formatted_address),
             lat = VALUES(lat),
             lng = VALUES(lng),
             search_terms = CONCAT(COALESCE(search_terms, ''), ', ', ?),
             locality = VALUES(locality),
             country = VALUES(country),
             last_used_at = CURRENT_TIMESTAMP`,
          [
            prediction.place_id,
            place.name,
            place.formatted_address,
            place.geometry?.location?.lat,
            place.geometry?.location?.lng,
            searchTerm,
            locality,
            country,
            searchTerm,
          ]
        );
      }
    } catch (error) {
      console.error("Error caching place:", error);
    }
  }
}

// POST /api/places/details - Get place details with distance calculation
export async function POST(req: NextRequest) {
  try {
    const { place_id, from_place_id } = await req.json();

    if (!place_id) {
      return NextResponse.json({ error: "place_id required" }, { status: 400 });
    }

    // Check cache first
    const cacheResult = await query(
      `SELECT * FROM places_cache WHERE place_id = ?`,
      [place_id]
    );

    let placeData;

    if (cacheResult.rows && cacheResult.rows.length > 0) {
      placeData = cacheResult.rows[0];
    } else {
      // Fetch from API
      const detailsUrl = new URL("https://maps.googleapis.com/maps/api/place/details/json");
      detailsUrl.searchParams.set("place_id", place_id);
      detailsUrl.searchParams.set("key", GOOGLE_PLACES_API_KEY);
      detailsUrl.searchParams.set("fields", "name,formatted_address,geometry,address_components");

      const response = await fetch(detailsUrl.toString());
      const data = await response.json();

      if (data.status === "OK" && data.result) {
        placeData = data.result;
        // Cache it
        const locality = placeData.address_components?.find((c: any) =>
          c.types.includes("locality")
        )?.long_name;
        const country = placeData.address_components?.find((c: any) =>
          c.types.includes("country")
        )?.long_name;

        await query(
          `INSERT INTO places_cache 
           (place_id, name, formatted_address, lat, lng, locality, country, hit_count)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1)
           ON DUPLICATE KEY UPDATE hit_count = hit_count + 1`,
          [
            place_id,
            placeData.name,
            placeData.formatted_address,
            placeData.geometry?.location?.lat,
            placeData.geometry?.location?.lng,
            locality,
            country,
          ]
        );
      }
    }

    // Calculate distance if from_place_id is provided
    let distance = null;
    if (from_place_id && placeData) {
      const fromPlaceResult = await query(
        `SELECT lat, lng FROM places_cache WHERE place_id = ?`,
        [from_place_id]
      );

      if (fromPlaceResult.rows && fromPlaceResult.rows.length > 0) {
        const fromPlace = fromPlaceResult.rows[0];
        const toLat = placeData.lat || placeData.geometry?.location?.lat;
        const toLng = placeData.lng || placeData.geometry?.location?.lng;

        if (fromPlace.lat && fromPlace.lng && toLat && toLng) {
          // Calculate distance using Haversine formula
          distance = calculateDistance(fromPlace.lat, fromPlace.lng, toLat, toLng);
        }
      }
    }

    return NextResponse.json({ place: placeData, distance });
  } catch (error) {
    console.error("Error getting place details:", error);
    return NextResponse.json(
      { error: "Failed to get place details" },
      { status: 500 }
    );
  }
}

// Haversine formula to calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}
