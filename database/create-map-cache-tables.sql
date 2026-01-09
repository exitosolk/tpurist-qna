-- Create table to cache map query results
CREATE TABLE IF NOT EXISTS map_query_cache (
  id INT AUTO_INCREMENT PRIMARY KEY,
  query_hash VARCHAR(64) UNIQUE NOT NULL, -- MD5 of query parameters
  bounds_minlat DECIMAL(10, 8),
  bounds_minlng DECIMAL(11, 8),
  bounds_maxlat DECIMAL(10, 8),
  bounds_maxlng DECIMAL(11, 8),
  tag VARCHAR(50),
  result_count INT,
  question_ids TEXT, -- JSON array of question IDs
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP, -- Cache expires after 5 minutes
  hit_count INT DEFAULT 0,
  INDEX idx_hash (query_hash),
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create table for API usage analytics
CREATE TABLE IF NOT EXISTS places_api_analytics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  endpoint VARCHAR(100) NOT NULL, -- 'autocomplete', 'details', 'nearby'
  cache_hit BOOLEAN DEFAULT FALSE,
  search_term VARCHAR(500),
  place_id VARCHAR(255),
  response_time_ms INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_endpoint (endpoint),
  INDEX idx_cache_hit (cache_hit),
  INDEX idx_created_at (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
