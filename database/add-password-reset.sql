-- Add password reset columns to users table
ALTER TABLE users
  ADD COLUMN password_reset_token VARCHAR(255) DEFAULT NULL,
  ADD COLUMN password_reset_expires TIMESTAMP NULL DEFAULT NULL;

-- Create index for faster lookups
CREATE INDEX idx_password_reset_token ON users(password_reset_token);
