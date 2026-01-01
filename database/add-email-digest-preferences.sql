-- Add email digest preferences to users table
-- Allow users to control how often they receive digest emails about followed content

ALTER TABLE users ADD COLUMN IF NOT EXISTS digest_frequency ENUM('never', 'daily', 'weekly') DEFAULT 'weekly' AFTER email_verified;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_digest_sent_at TIMESTAMP NULL AFTER digest_frequency;

-- Create index for efficient digest sending queries
CREATE INDEX IF NOT EXISTS idx_digest_frequency ON users(digest_frequency, last_digest_sent_at);
