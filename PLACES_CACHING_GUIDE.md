# Places API Caching System

## Overview
The OneCeylon platform uses an intelligent caching system to reduce Google Places API costs by up to 90% while improving response times for users.

## How It Works

### 1. **Places Cache Table**
```sql
CREATE TABLE places_cache (
  place_id VARCHAR(255) UNIQUE,
  name VARCHAR(500),
  formatted_address VARCHAR(1000),
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  search_terms TEXT,
  hit_count INT,
  created_at TIMESTAMP,
  last_used_at TIMESTAMP
);
```

### 2. **Cache-First Strategy**

#### Autocomplete Flow:
1. User types "Ella" in location search
2. Check local `places_cache` table first
3. If found → Return instantly (0.01s response time)
4. If not found → Call Google Places API
5. Store result in cache for future use
6. Return to user

#### Details Flow:
1. User selects a place
2. Check cache for full details
3. If cached → Return with coordinates
4. If not → Fetch from Google API
5. Cache for next time

### 3. **Smart Cache Features**

**Hit Count Tracking**:
- Popular places appear first in autocomplete
- "Colombo", "Ella", "Sigiriya" will be fastest after a few searches

**Search Terms Storage**:
- Multiple search variations stored
- "Ella town", "Ella station", "Ella Sri Lanka" all match

**Last Used Timestamp**:
- Recently used places stay in memory
- Auto-cleanup of stale data

## Database Tables

### `places_cache`
Main storage for place data
- **Primary**: Stores Google Places API results
- **Indexes**: place_id, name, locality, coordinates
- **Fulltext**: Enables fast text search

### `map_query_cache` (New)
Caches map viewport queries
- **TTL**: 5 minutes (map data changes slowly)
- **Hash-based**: Unique key for bounds + filters
- **Saves**: Entire map query results

### `places_api_analytics` (New)
Tracks API usage and savings
- **Metrics**: Cache hit rate, response times
- **Cost tracking**: Estimated $ saved per day
- **Debugging**: See which queries miss cache

## Setup Instructions

### 1. Run Database Migrations

```bash
# Create cache tables (if not already exists)
mysql -u your_user -p your_database < database/create-places-cache-table.sql

# Create analytics tables
mysql -u your_user -p your_database < database/create-map-cache-tables.sql

# Optional: Optimize indexes
mysql -u your_user -p your_database < database/optimize-places-cache.sql
```

### 2. Verify Cache is Working

```sql
-- Check cache stats
source database/check-places-cache.sql
```

Expected output:
```
total_cached_places: 150
total_cache_hits: 3,450
```

### 3. Monitor via API

```bash
# View real-time stats
curl https://oneceylon.space/api/admin/cache-stats
```

Response:
```json
{
  "stats": {
    "places": {
      "total_places": 150,
      "total_hits": 3450,
      "avg_hits": 23
    },
    "api": [
      {
        "endpoint": "autocomplete",
        "total_calls": 500,
        "cache_hits": 425,
        "cache_hit_rate": 85.00,
        "avg_response_time": 45
      }
    ]
  },
  "estimatedSavings": {
    "autocomplete": "$1.20",
    "details": "$5.10",
    "total": "$6.30"
  }
}
```

## Performance Improvements

### Before Caching:
- **Autocomplete**: 200-500ms (Google API latency)
- **Details**: 300-800ms
- **Cost**: $0.00283 per autocomplete + $0.017 per details
- **Monthly**: ~$50-100 for moderate traffic

### After Caching:
- **Autocomplete**: 10-50ms (85%+ cache hit rate)
- **Details**: 5-20ms (90%+ cache hit rate)
- **Cost**: ~$5-15 per month (90% reduction)
- **UX**: Instant results for popular places

## Cache Maintenance

### Auto-Cleanup (Recommended)

Create a cron job to clean expired caches:

```javascript
// lib/cron.ts
import { cleanExpiredCaches } from '@/lib/places-cache';

// Run every hour
setInterval(async () => {
  await cleanExpiredCaches();
}, 3600000);
```

### Manual Cleanup

```sql
-- Remove places not used in 90 days
DELETE FROM places_cache 
WHERE last_used_at < DATE_SUB(NOW(), INTERVAL 90 DAY)
AND hit_count < 5;

-- Clear map cache (TTL handles this automatically)
DELETE FROM map_query_cache WHERE expires_at < NOW();
```

## Best Practices

### 1. **Gradual Cache Warming**
- Don't pre-populate cache
- Let users organically build it
- Popular places naturally rise to top

### 2. **Monitor Cache Hit Rate**
- Target: 80%+ hit rate after first week
- If lower: Check search patterns
- Consider adding manual seeds for tourist spots

### 3. **Cost Monitoring**
```sql
-- Daily API cost estimate
SELECT 
  DATE(created_at) as date,
  endpoint,
  COUNT(*) as total_calls,
  SUM(CASE WHEN cache_hit THEN 0 ELSE 1 END) as api_calls,
  SUM(CASE WHEN cache_hit THEN 0 
      WHEN endpoint='autocomplete' THEN 0.00283
      WHEN endpoint='details' THEN 0.017
      ELSE 0 END) as cost_usd
FROM places_api_analytics
WHERE created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY DATE(created_at), endpoint
ORDER BY date DESC;
```

### 4. **Seed High-Value Places**

For production, optionally seed cache with top tourist destinations:

```sql
-- Insert popular places (get place_id from Google Places manually)
INSERT INTO places_cache 
(place_id, name, formatted_address, lat, lng, locality, hit_count)
VALUES 
('ChIJ...(Ella)', 'Ella', 'Ella, Sri Lanka', 6.8667, 81.0456, 'Ella', 100),
('ChIJ...(Sigiriya)', 'Sigiriya', 'Sigiriya, Sri Lanka', 7.9568, 80.7597, 'Sigiriya', 100);
```

## Troubleshooting

### Cache Not Working?

**Check 1**: Verify tables exist
```sql
SHOW TABLES LIKE '%cache%';
```

**Check 2**: Check permissions
```sql
SHOW GRANTS FOR your_user@localhost;
```

**Check 3**: View recent queries
```sql
SELECT * FROM places_api_analytics ORDER BY created_at DESC LIMIT 10;
```

If all `cache_hit = 0`, there's an issue.

### Low Hit Rate?

**Possible causes**:
- Users searching with typos/variations
- New locations being searched
- Cache table empty (needs time to build)

**Solutions**:
- Add search term normalization
- Implement fuzzy matching
- Manually seed top 50 places

### High API Costs?

**Check**:
```sql
SELECT 
  DATE(created_at) as date,
  SUM(CASE WHEN NOT cache_hit THEN 1 ELSE 0 END) as api_calls
FROM places_api_analytics
WHERE endpoint = 'details'
GROUP BY DATE(created_at);
```

If seeing 100+ details calls/day, investigate:
- Are users repeatedly selecting same places?
- Cache might be getting cleared
- Check `last_used_at` updates

## Cost Savings Calculator

Monthly savings estimate:

| Traffic Level | Searches/Day | Cache Hit Rate | Monthly Cost (Before) | Monthly Cost (After) | Savings |
|--------------|--------------|----------------|----------------------|---------------------|---------|
| Low | 100 | 80% | $8.50 | $1.70 | $6.80 |
| Medium | 500 | 85% | $42.50 | $6.38 | $36.12 |
| High | 2000 | 90% | $170.00 | $17.00 | $153.00 |

## Files Reference

### Core Implementation
- `app/api/places/route.ts` - Main API with cache logic
- `lib/places-cache.ts` - Cache utilities and analytics
- `database/create-places-cache-table.sql` - Cache table schema
- `database/create-map-cache-tables.sql` - Map cache + analytics

### Monitoring
- `app/api/admin/cache-stats/route.ts` - Stats endpoint
- `database/check-places-cache.sql` - Quick stats queries
- `database/optimize-places-cache.sql` - Index optimization

## Future Enhancements

1. **Redis Integration**: For sub-millisecond cache access
2. **CDN Caching**: Cache autocomplete at edge
3. **Predictive Pre-fetch**: Load nearby places before user searches
4. **ML-based Suggestions**: Learn user patterns
5. **Batch API Calls**: Reduce API overhead

## Support

For issues or questions:
1. Check analytics: `/api/admin/cache-stats`
2. Review SQL: `database/check-places-cache.sql`
3. Monitor logs for "Fetching from Google Places API" (should be rare)
