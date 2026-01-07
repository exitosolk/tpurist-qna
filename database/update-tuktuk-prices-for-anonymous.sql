-- Update tuktuk_prices table to support anonymous reporting
-- Make user_id nullable and add tracking fields

ALTER TABLE tuktuk_prices 
  MODIFY COLUMN user_id INT NULL;

-- Add anonymous tracking fields
ALTER TABLE tuktuk_prices
  ADD COLUMN is_anonymous BOOLEAN DEFAULT FALSE AFTER user_id,
  ADD COLUMN anonymous_session VARCHAR(255) NULL AFTER is_anonymous,
  ADD COLUMN ip_hash VARCHAR(64) NULL AFTER anonymous_session;

-- Add distance and per-km price for better pricing insights
ALTER TABLE tuktuk_prices
  ADD COLUMN distance_km DECIMAL(10, 2) NULL AFTER price,
  ADD COLUMN price_per_km DECIMAL(10, 2) NULL AFTER distance_km;

-- Add place_id references for better location matching
ALTER TABLE tuktuk_prices
  ADD COLUMN start_place_id VARCHAR(255) NULL AFTER start_location,
  ADD COLUMN end_place_id VARCHAR(255) NULL AFTER end_location;

-- Add indexes for new fields
CREATE INDEX idx_anonymous ON tuktuk_prices(is_anonymous);
CREATE INDEX idx_place_ids ON tuktuk_prices(start_place_id, end_place_id);
CREATE INDEX idx_distance ON tuktuk_prices(distance_km);
