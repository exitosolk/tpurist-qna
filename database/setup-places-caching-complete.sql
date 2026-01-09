-- Complete Places Caching System Setup
-- Run this file to set up all caching tables and optimizations

-- ============================================
-- 1. Places Cache Table (Main storage)
-- ============================================
CREATE TABLE IF NOT EXISTS places_cache (
  id INT AUTO_INCREMENT PRIMARY KEY,
  place_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(500) NOT NULL,
  formatted_address VARCHAR(1000) NOT NULL,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  search_terms TEXT,
  country VARCHAR(100),
  locality VARCHAR(255),
  hit_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_place_id (place_id),
  INDEX idx_search (name(255), formatted_address(255)),
  INDEX idx_locality (locality),
  INDEX idx_hit_count (hit_count DESC),
  INDEX idx_coordinates (lat, lng),
  INDEX idx_name_locality (name(100), locality)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Note: FULLTEXT index already exists from initial setup
-- If you need to recreate it, manually run: DROP INDEX idx_fulltext_search ON places_cache;
-- Then run: CREATE FULLTEXT INDEX idx_fulltext_search ON places_cache(name, formatted_address, search_terms);

-- ============================================
-- 2. Map Query Cache (Viewport results)
-- ============================================
CREATE TABLE IF NOT EXISTS map_query_cache (
  id INT AUTO_INCREMENT PRIMARY KEY,
  query_hash VARCHAR(64) UNIQUE NOT NULL,
  bounds_minlat DECIMAL(10, 8),
  bounds_minlng DECIMAL(11, 8),
  bounds_maxlat DECIMAL(10, 8),
  bounds_maxlng DECIMAL(11, 8),
  tag VARCHAR(50),
  result_count INT,
  question_ids TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  hit_count INT DEFAULT 0,
  INDEX idx_hash (query_hash),
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. API Analytics (Cost tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS places_api_analytics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  endpoint VARCHAR(100) NOT NULL,
  cache_hit BOOLEAN DEFAULT FALSE,
  search_term VARCHAR(500),
  place_id VARCHAR(255),
  response_time_ms INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_endpoint (endpoint),
  INDEX idx_cache_hit (cache_hit),
  INDEX idx_created_at (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 4. Optimize Tables
-- ============================================
ANALYZE TABLE places_cache;
ANALYZE TABLE map_query_cache;
ANALYZE TABLE places_api_analytics;

-- ============================================
-- 5. Verification Query
-- ============================================
SELECT 
  'Setup Complete!' as status,
  (SELECT COUNT(*) FROM information_schema.tables 
   WHERE table_schema = DATABASE() 
   AND table_name IN ('places_cache', 'map_query_cache', 'places_api_analytics')) as tables_created,
  (SELECT COUNT(*) FROM information_schema.statistics 
   WHERE table_schema = DATABASE() 
   AND table_name = 'places_cache') as indexes_on_places_cache;
