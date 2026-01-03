-- Tag Badge System
-- Implements Bronze/Silver/Gold badges for tags with freshness decay

-- Drop existing tables if they exist
DROP TABLE IF EXISTS tag_badge_activity;
DROP TABLE IF EXISTS user_tag_badges;
DROP TABLE IF EXISTS user_tag_scores;
DROP TABLE IF EXISTS tag_badge_config;

-- Configuration for tag badge tiers
CREATE TABLE tag_badge_config (
  id INT PRIMARY KEY AUTO_INCREMENT,
  badge_tier ENUM('bronze', 'silver', 'gold') NOT NULL UNIQUE,
  min_score INT NOT NULL,
  min_accepted_answers INT DEFAULT 0,
  description TEXT,
  superpower TEXT,
  requires_freshness BOOLEAN DEFAULT FALSE,
  freshness_points_required INT DEFAULT 0,
  freshness_period_months INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Default configuration
INSERT INTO tag_badge_config 
(badge_tier, min_score, min_accepted_answers, description, superpower, requires_freshness, freshness_points_required, freshness_period_months) 
VALUES
('bronze', 5, 0, 'Explorer - Earned by helping a few people in this tag', 'Bragging rights on profile', FALSE, 0, 0),
('silver', 25, 3, 'Guide - Consistent problem solver in this tag', 'Retagging rights without approval', FALSE, 0, 0),
('gold', 75, 10, 'Resident Expert - Domain master in this tag', 'Single-vote duplicate/spam marking (The Hammer)', TRUE, 5, 6);

-- User tag scores tracking
CREATE TABLE user_tag_scores (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  tag_id INT NOT NULL,
  total_score INT DEFAULT 0,
  accepted_answers_count INT DEFAULT 0,
  last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_tag (user_id, tag_id),
  INDEX idx_user_tag (user_id, tag_id),
  INDEX idx_tag_score (tag_id, total_score DESC),
  INDEX idx_last_activity (last_activity_at)
) ENGINE=InnoDB;

-- User tag badges
CREATE TABLE user_tag_badges (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  tag_id INT NOT NULL,
  badge_tier ENUM('bronze', 'silver', 'gold') NOT NULL,
  earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  last_freshness_check TIMESTAMP NULL,
  freshness_score_since_check INT DEFAULT 0,
  marked_inactive_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_tag_tier (user_id, tag_id, badge_tier),
  INDEX idx_user_badges (user_id, is_active),
  INDEX idx_tag_badges (tag_id, badge_tier, is_active),
  INDEX idx_freshness (last_freshness_check, is_active)
) ENGINE=InnoDB;

-- Tag badge activity log (for freshness tracking)
CREATE TABLE tag_badge_activity (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  tag_id INT NOT NULL,
  activity_type ENUM('upvote', 'accepted_answer', 'bounty') NOT NULL,
  points_earned INT NOT NULL,
  question_id INT NULL,
  answer_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE SET NULL,
  FOREIGN KEY (answer_id) REFERENCES answers(id) ON DELETE SET NULL,
  INDEX idx_user_tag_activity (user_id, tag_id, created_at DESC),
  INDEX idx_freshness_tracking (user_id, tag_id, created_at)
) ENGINE=InnoDB;

-- Create indexes for common queries
CREATE INDEX idx_top_users_by_tag ON user_tag_scores(tag_id, total_score DESC);
CREATE INDEX idx_user_expertise ON user_tag_scores(user_id, total_score DESC);
CREATE INDEX idx_badge_holders ON user_tag_badges(tag_id, badge_tier, is_active);
