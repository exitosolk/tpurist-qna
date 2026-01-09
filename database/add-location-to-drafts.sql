-- Add location fields to drafts table
ALTER TABLE drafts 
ADD COLUMN place_id VARCHAR(255),
ADD COLUMN place_name VARCHAR(500),
ADD COLUMN formatted_address VARCHAR(1000),
ADD COLUMN latitude DECIMAL(10, 8),
ADD COLUMN longitude DECIMAL(11, 8);

-- Add index on place_id for faster lookups
ALTER TABLE drafts ADD INDEX idx_place_id (place_id);
