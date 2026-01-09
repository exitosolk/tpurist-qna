-- Check if places_cache table exists and view cached data
SELECT 
  COUNT(*) as total_cached_places,
  SUM(hit_count) as total_cache_hits
FROM places_cache;

-- View top 10 most popular cached places
SELECT 
  name,
  formatted_address,
  hit_count,
  last_used_at
FROM places_cache
ORDER BY hit_count DESC
LIMIT 10;

-- View cache statistics by locality
SELECT 
  locality,
  COUNT(*) as place_count,
  SUM(hit_count) as total_hits
FROM places_cache
WHERE locality IS NOT NULL
GROUP BY locality
ORDER BY total_hits DESC
LIMIT 15;

-- Recent cache additions
SELECT 
  name,
  formatted_address,
  created_at,
  hit_count
FROM places_cache
ORDER BY created_at DESC
LIMIT 10;
