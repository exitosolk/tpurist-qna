-- Supporting tables for the hammer feature (Gold badge duplicate/spam marking)

-- Question duplicate tracking
CREATE TABLE IF NOT EXISTS question_duplicates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  question_id INT NOT NULL,
  duplicate_of INT NOT NULL,
  marked_by INT NOT NULL,
  marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  FOREIGN KEY (duplicate_of) REFERENCES questions(id) ON DELETE CASCADE,
  FOREIGN KEY (marked_by) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_duplicate (question_id),
  INDEX idx_duplicate_of (duplicate_of),
  INDEX idx_marked_by (marked_by)
) ENGINE=InnoDB;

-- Close votes tracking
CREATE TABLE IF NOT EXISTS close_votes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  question_id INT NOT NULL,
  user_id INT NOT NULL,
  vote_type ENUM('duplicate', 'spam', 'off-topic', 'too-broad', 'unclear', 'opinion-based') NOT NULL,
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_vote (question_id, user_id),
  INDEX idx_question_votes (question_id, vote_type),
  INDEX idx_user_votes (user_id, created_at DESC)
) ENGINE=InnoDB;

-- Moderation log for tracking hammer and other moderation actions
CREATE TABLE IF NOT EXISTS moderation_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  action_type ENUM('hammer_close', 'retag', 'delete', 'undelete', 'lock', 'unlock', 'feature', 'protect') NOT NULL,
  target_type ENUM('question', 'answer', 'comment', 'user') NOT NULL,
  target_id INT NOT NULL,
  reason TEXT,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_actions (user_id, created_at DESC),
  INDEX idx_target (target_type, target_id),
  INDEX idx_action_type (action_type, created_at DESC)
) ENGINE=InnoDB;

-- Add columns to questions table (skip if already exist)
-- Note: If columns already exist, comment out the ADD COLUMN lines that fail
ALTER TABLE questions 
  ADD COLUMN is_closed BOOLEAN DEFAULT FALSE,
  ADD COLUMN closed_at TIMESTAMP NULL,
  ADD COLUMN closed_by INT NULL,
  ADD COLUMN closed_reason TEXT NULL;

-- Add index for closed questions
ALTER TABLE questions ADD INDEX idx_closed (is_closed, closed_at);

-- Add foreign key for closed_by
ALTER TABLE questions 
  ADD CONSTRAINT fk_closed_by 
  FOREIGN KEY (closed_by) REFERENCES users(id) ON DELETE SET NULL;
