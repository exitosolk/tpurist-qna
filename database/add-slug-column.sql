-- Add slug column to questions table
ALTER TABLE questions ADD COLUMN slug VARCHAR(255) UNIQUE AFTER title;

-- Create index on slug for faster lookups
CREATE INDEX idx_questions_slug ON questions(slug);
