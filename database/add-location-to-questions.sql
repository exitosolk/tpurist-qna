-- Add location fields to questions table
ALTER TABLE questions
  ADD COLUMN place_id VARCHAR(255) DEFAULT NULL,
  ADD COLUMN place_name VARCHAR(500) DEFAULT NULL,
  ADD COLUMN formatted_address VARCHAR(1000) DEFAULT NULL,
  ADD COLUMN latitude DECIMAL(10, 8) DEFAULT NULL,
  ADD COLUMN longitude DECIMAL(11, 8) DEFAULT NULL,
  ADD INDEX idx_place_id (place_id),
  ADD INDEX idx_latitude (latitude),
  ADD INDEX idx_longitude (longitude);

-- Add location fields to answers table
ALTER TABLE answers
  ADD COLUMN place_id VARCHAR(255) DEFAULT NULL,
  ADD COLUMN place_name VARCHAR(500) DEFAULT NULL,
  ADD COLUMN formatted_address VARCHAR(1000) DEFAULT NULL,
  ADD COLUMN latitude DECIMAL(10, 8) DEFAULT NULL,
  ADD COLUMN longitude DECIMAL(11, 8) DEFAULT NULL,
  ADD INDEX idx_place_id (place_id),
  ADD INDEX idx_latitude (latitude),
  ADD INDEX idx_longitude (longitude);

-- Note: Using regular B-tree indexes on latitude/longitude for bounding box queries
-- SPATIAL INDEX requires POINT/GEOMETRY columns which adds complexity
-- Current implementation is sufficient for Sri Lanka's geographic size
