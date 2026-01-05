-- Add login streak tracking to users table for Seasoned Traveler badge

ALTER TABLE users 
ADD COLUMN last_login_at TIMESTAMP NULL AFTER updated_at,
ADD COLUMN current_streak INT DEFAULT 0 AFTER last_login_at,
ADD COLUMN longest_streak INT DEFAULT 0 AFTER current_streak,
ADD INDEX idx_current_streak (current_streak);
