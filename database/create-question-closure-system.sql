-- Question Closure System for oneceylon.space
-- Implements community close voting and automatic closure thresholds

-- Add closure fields to questions table (handle if columns already exist)
-- Add is_closed if it doesn't exist
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'questions' 
  AND COLUMN_NAME = 'is_closed';

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE questions ADD COLUMN is_closed BOOLEAN DEFAULT FALSE AFTER answer_count',
  'SELECT "Column is_closed already exists, skipping..." AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add closed_at if it doesn't exist
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'questions' 
  AND COLUMN_NAME = 'closed_at';

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE questions ADD COLUMN closed_at TIMESTAMP NULL',
  'SELECT "Column closed_at already exists, skipping..." AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add closed_by if it doesn't exist
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'questions' 
  AND COLUMN_NAME = 'closed_by';

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE questions ADD COLUMN closed_by INT NULL',
  'SELECT "Column closed_by already exists, skipping..." AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add close_reason if it doesn't exist
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'questions' 
  AND COLUMN_NAME = 'close_reason';

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE questions ADD COLUMN close_reason VARCHAR(100) NULL',
  'SELECT "Column close_reason already exists, skipping..." AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add close_details if it doesn't exist
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'questions' 
  AND COLUMN_NAME = 'close_details';

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE questions ADD COLUMN close_details TEXT NULL',
  'SELECT "Column close_details already exists, skipping..." AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add auto_closed if it doesn't exist
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'questions' 
  AND COLUMN_NAME = 'auto_closed';

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE questions ADD COLUMN auto_closed BOOLEAN DEFAULT FALSE',
  'SELECT "Column auto_closed already exists, skipping..." AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add indexes if they don't exist
SET @idx_exists = 0;
SELECT COUNT(*) INTO @idx_exists 
FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'questions' 
  AND INDEX_NAME = 'idx_is_closed';

SET @sql = IF(@idx_exists = 0,
  'ALTER TABLE questions ADD INDEX idx_is_closed (is_closed)',
  'SELECT "Index idx_is_closed already exists, skipping..." AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = 0;
SELECT COUNT(*) INTO @idx_exists 
FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'questions' 
  AND INDEX_NAME = 'idx_closed_at';

SET @sql = IF(@idx_exists = 0,
  'ALTER TABLE questions ADD INDEX idx_closed_at (closed_at)',
  'SELECT "Index idx_closed_at already exists, skipping..." AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add foreign key if it doesn't exist
SET @fk_exists = 0;
SELECT COUNT(*) INTO @fk_exists 
FROM information_schema.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'questions' 
  AND CONSTRAINT_NAME = 'fk_closed_by';

SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE questions ADD CONSTRAINT fk_closed_by FOREIGN KEY (closed_by) REFERENCES users(id) ON DELETE SET NULL',
  'SELECT "Foreign key fk_closed_by already exists, skipping..." AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Close reasons lookup table
CREATE TABLE IF NOT EXISTS close_reasons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reason_key VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  requires_details BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_reason_key (reason_key),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default close reasons
INSERT INTO close_reasons (reason_key, display_name, description, requires_details) VALUES
('duplicate', 'Duplicate', 'This question has already been asked and answered', TRUE),
('off_topic', 'Off-Topic', 'This question is not about Sri Lanka travel and does not belong here', FALSE),
('unclear', 'Unclear What You''re Asking', 'This question is vague, incomplete, or needs more details to be answerable', FALSE),
('too_broad', 'Too Broad', 'This question asks multiple things or is too broad to answer effectively', FALSE),
('opinion_based', 'Opinion-Based', 'This question is purely opinion-based and does not have a factual answer', FALSE),
('spam', 'Spam', 'This question is spam or promotional content', FALSE),
('outdated_irrelevant', 'No Longer Relevant', 'This question is about something that is no longer applicable or relevant', FALSE)
ON DUPLICATE KEY UPDATE 
  display_name = VALUES(display_name),
  description = VALUES(description);

-- Close votes table (for community voting)
CREATE TABLE IF NOT EXISTS question_close_votes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  question_id INT NOT NULL,
  user_id INT NOT NULL,
  close_reason_id INT NOT NULL,
  close_details TEXT NULL,
  voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (close_reason_id) REFERENCES close_reasons(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_question_close (question_id, user_id, is_active),
  INDEX idx_question (question_id, is_active),
  INDEX idx_user (user_id),
  INDEX idx_voted_at (voted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reopen votes table (for reopening closed questions)
CREATE TABLE IF NOT EXISTS question_reopen_votes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  question_id INT NOT NULL,
  user_id INT NOT NULL,
  reason TEXT NULL,
  voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_question_reopen (question_id, user_id, is_active),
  INDEX idx_question (question_id, is_active),
  INDEX idx_user (user_id),
  INDEX idx_voted_at (voted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Closure configuration
CREATE TABLE IF NOT EXISTS closure_config (
  id INT AUTO_INCREMENT PRIMARY KEY,
  config_key VARCHAR(100) NOT NULL UNIQUE,
  config_value VARCHAR(255) NOT NULL,
  description TEXT,
  INDEX idx_config_key (config_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default configuration
INSERT INTO closure_config (config_key, config_value, description) VALUES
('close_votes_needed', '5', 'Number of close votes required to close a question (default: 5)'),
('reopen_votes_needed', '5', 'Number of reopen votes required to reopen a question (default: 5)'),
('min_reputation_close', '500', 'Minimum reputation required to vote to close (default: 500)'),
('min_reputation_reopen', '500', 'Minimum reputation required to vote to reopen (default: 500)'),
('auto_close_score_threshold', '-5', 'Score threshold for automatic closure (default: -5)'),
('auto_close_enabled', 'true', 'Whether automatic closure based on score is enabled'),
('close_vote_aging_days', '7', 'Days after which close votes expire if question not closed (default: 7)'),
('gold_badge_hammer_enabled', 'true', 'Whether gold tag badge holders can close with single vote')
ON DUPLICATE KEY UPDATE 
  config_value = VALUES(config_value),
  description = VALUES(description);

-- Track automatic closures for analytics
CREATE TABLE IF NOT EXISTS auto_closure_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  question_id INT NOT NULL,
  score_at_closure INT NOT NULL,
  closed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  INDEX idx_question (question_id),
  INDEX idx_closed_at (closed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- View for active close vote counts by question
CREATE OR REPLACE VIEW question_close_vote_counts AS
SELECT 
  qcv.question_id,
  cr.reason_key,
  cr.display_name as reason_display_name,
  COUNT(DISTINCT qcv.user_id) as vote_count,
  MIN(qcv.voted_at) as first_vote_at,
  MAX(qcv.voted_at) as last_vote_at
FROM question_close_votes qcv
JOIN close_reasons cr ON qcv.close_reason_id = cr.id
WHERE qcv.is_active = TRUE
GROUP BY qcv.question_id, cr.reason_key, cr.display_name;

-- View for questions with pending close votes
CREATE OR REPLACE VIEW questions_pending_closure AS
SELECT 
  q.id,
  q.title,
  q.user_id,
  q.score,
  q.created_at,
  qcvc.reason_key,
  qcvc.reason_display_name,
  qcvc.vote_count,
  qcvc.first_vote_at,
  qcvc.last_vote_at,
  (SELECT config_value FROM closure_config WHERE config_key = 'close_votes_needed') as votes_needed
FROM questions q
JOIN question_close_vote_counts qcvc ON q.id = qcvc.question_id
WHERE q.is_closed = FALSE
ORDER BY qcvc.vote_count DESC, qcvc.first_vote_at ASC;
