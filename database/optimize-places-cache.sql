-- Optimize places_cache table for better performance

-- Add composite index for common search patterns
ALTER TABLE places_cache 
  ADD INDEX idx_name_locality (name(100), locality);

-- Add index for geographic queries
ALTER TABLE places_cache
  ADD INDEX idx_coordinates (lat, lng);

-- Analyze table to update statistics
ANALYZE TABLE places_cache;

-- View index usage
SHOW INDEX FROM places_cache;
