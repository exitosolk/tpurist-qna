-- Add experience_date column to answers table for price timestamping
ALTER TABLE answers 
  ADD COLUMN experience_date DATE DEFAULT NULL;

-- Create index for faster experience date queries
CREATE INDEX idx_experience_date ON answers(experience_date);
