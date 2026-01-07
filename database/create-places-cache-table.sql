-- Create places_cache table for Google Places API caching
-- This reduces API costs by storing previously fetched place data
CREATE TABLE IF NOT EXISTS places_cache (
  id INT AUTO_INCREMENT PRIMARY KEY,
  place_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(500) NOT NULL,
  formatted_address VARCHAR(1000) NOT NULL,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  search_terms TEXT, -- Store common search terms that match this place
  country VARCHAR(100),
  locality VARCHAR(255),
  hit_count INT DEFAULT 0, -- Track how often this place is used
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_place_id (place_id),
  INDEX idx_search (name(255), formatted_address(255)),
  INDEX idx_locality (locality),
  INDEX idx_hit_count (hit_count DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add index for full-text search on commonly used fields
CREATE FULLTEXT INDEX idx_fulltext_search ON places_cache(name, formatted_address, search_terms);
