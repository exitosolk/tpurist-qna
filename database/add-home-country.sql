-- Add home_country field to users table for Ayubowan badge requirement
ALTER TABLE users 
ADD COLUMN home_country VARCHAR(100) NULL AFTER bio;
