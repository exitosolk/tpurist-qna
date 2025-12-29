-- Revision History for Questions and Answers
CREATE TABLE IF NOT EXISTS revision_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  content_type ENUM('question', 'answer') NOT NULL,
  content_id INT NOT NULL,
  user_id INT NOT NULL,
  title_before TEXT,
  title_after TEXT,
  body_before TEXT NOT NULL,
  body_after TEXT NOT NULL,
  tags_before TEXT,
  tags_after TEXT,
  edit_reason VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_content (content_type, content_id),
  INDEX idx_user (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Add edited_at and edit_count columns to questions table
-- Run these separately if columns already exist, skip the ones that fail
ALTER TABLE questions ADD COLUMN edited_at TIMESTAMP NULL;
ALTER TABLE questions ADD COLUMN edit_count INT DEFAULT 0;

-- Add edited_at and edit_count columns to answers table
ALTER TABLE answers ADD COLUMN edited_at TIMESTAMP NULL;
ALTER TABLE answers ADD COLUMN edit_count INT DEFAULT 0;
