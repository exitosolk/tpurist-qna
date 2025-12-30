-- Review System for oneceylon.space
-- Community-powered content moderation

-- Table to track flagged content in review queues
CREATE TABLE IF NOT EXISTS review_queue (
  id INT AUTO_INCREMENT PRIMARY KEY,
  content_type ENUM('question', 'answer', 'comment') NOT NULL,
  content_id INT NOT NULL,
  review_type ENUM('spam_scam', 'outdated') NOT NULL,
  flagged_by INT NOT NULL,
  flagged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('pending', 'approved', 'rejected', 'completed') DEFAULT 'pending',
  resolution_at TIMESTAMP NULL,
  -- Track the number of votes
  hide_votes INT DEFAULT 0,
  keep_votes INT DEFAULT 0,
  INDEX idx_status (status),
  INDEX idx_review_type (review_type),
  INDEX idx_flagged_by (flagged_by),
  INDEX idx_content (content_type, content_id),
  FOREIGN KEY (flagged_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Table to track individual review votes
CREATE TABLE IF NOT EXISTS review_votes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  review_queue_id INT NOT NULL,
  user_id INT NOT NULL,
  vote ENUM('hide', 'keep', 'outdated', 'current') NOT NULL,
  voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_review (review_queue_id, user_id),
  INDEX idx_queue (review_queue_id),
  INDEX idx_user (user_id),
  FOREIGN KEY (review_queue_id) REFERENCES review_queue(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table to track content status after review
CREATE TABLE IF NOT EXISTS content_flags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  content_type ENUM('question', 'answer', 'comment') NOT NULL,
  content_id INT NOT NULL,
  flag_type ENUM('hidden_spam', 'outdated') NOT NULL,
  flagged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  review_queue_id INT,
  is_active BOOLEAN DEFAULT TRUE,
  -- Track who can see hidden content (admins/moderators)
  hidden_by_community BOOLEAN DEFAULT TRUE,
  UNIQUE KEY unique_content_flag (content_type, content_id, flag_type, is_active),
  INDEX idx_content (content_type, content_id),
  INDEX idx_flag_type (flag_type),
  INDEX idx_active (is_active),
  FOREIGN KEY (review_queue_id) REFERENCES review_queue(id) ON DELETE SET NULL
);

-- Review system configuration
-- Thresholds for automatic action
CREATE TABLE IF NOT EXISTS review_thresholds (
  id INT AUTO_INCREMENT PRIMARY KEY,
  review_type ENUM('spam_scam', 'outdated') NOT NULL,
  min_reputation INT NOT NULL,
  votes_needed INT NOT NULL,
  description TEXT,
  UNIQUE KEY unique_review_type (review_type)
);

-- Insert default thresholds
INSERT INTO review_thresholds (review_type, min_reputation, votes_needed, description) VALUES
('spam_scam', 100, 3, 'Scam & Spam Patrol - Requires 100 reputation, 3 votes to hide'),
('outdated', 500, 3, 'Fact Checker - Requires 500 reputation, 3 votes to mark as outdated')
ON DUPLICATE KEY UPDATE 
  min_reputation = VALUES(min_reputation),
  votes_needed = VALUES(votes_needed),
  description = VALUES(description);

-- NOTE: Reputation events for review actions
-- If you have a reputation_events table, you can manually add these:
-- INSERT INTO reputation_events (event_type, points, description) VALUES
-- ('review_helpful', 2, 'Review vote agreed with community consensus'),
-- ('review_completed', 1, 'Completed a review task')
-- ON DUPLICATE KEY UPDATE points = VALUES(points), description = VALUES(description);
