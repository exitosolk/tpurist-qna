-- Quality Ban System
-- Implements a rolling quality-based ban for users who consistently post low-quality questions
-- Users are banned based on their content quality, not time limits
-- The only way to lift a ban is to improve existing content

-- Drop existing tables if they exist
DROP TABLE IF EXISTS question_quality_strikes;
DROP TABLE IF EXISTS user_quality_bans;
DROP TABLE IF EXISTS question_quality_metrics;

-- Track quality metrics for each question
CREATE TABLE question_quality_metrics (
  question_id INT PRIMARY KEY,
  downvote_count INT DEFAULT 0,
  upvote_count INT DEFAULT 0,
  is_closed BOOLEAN DEFAULT FALSE,
  close_reason VARCHAR(255),
  closed_at TIMESTAMP NULL,
  last_edit_at TIMESTAMP NULL,
  quality_score DECIMAL(5,2) DEFAULT 0.00,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  INDEX idx_quality_score (quality_score),
  INDEX idx_updated_at (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Track quality strikes against users
CREATE TABLE question_quality_strikes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  question_id INT NOT NULL,
  strike_type ENUM('downvote', 'closed', 'deleted') NOT NULL,
  strike_value DECIMAL(3,2) DEFAULT 1.00,
  is_active BOOLEAN DEFAULT TRUE,
  strike_reason VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  removed_at TIMESTAMP NULL,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  INDEX idx_user_active (user_id, is_active),
  INDEX idx_created_at (created_at),
  UNIQUE KEY unique_user_question_strike (user_id, question_id, strike_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Track user quality bans
CREATE TABLE user_quality_bans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  ban_type ENUM('question_ban') NOT NULL,
  ban_level ENUM('warning', 'week', 'month', 'permanent') NOT NULL,
  total_strikes INT DEFAULT 0,
  active_strikes INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  ban_reason TEXT,
  banned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL,
  lifted_at TIMESTAMP NULL,
  lift_reason VARCHAR(500),
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_active (user_id, is_active, ban_type),
  INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Configuration table for quality ban thresholds
CREATE TABLE quality_ban_config (
  id INT AUTO_INCREMENT PRIMARY KEY,
  config_key VARCHAR(100) UNIQUE NOT NULL,
  config_value VARCHAR(255) NOT NULL,
  description TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default configuration values
INSERT INTO quality_ban_config (config_key, config_value, description) VALUES
-- Strike thresholds for different ban levels
('strikes_for_warning', '3', 'Number of strikes before issuing a warning'),
('strikes_for_week_ban', '5', 'Number of strikes before 1-week question ban'),
('strikes_for_month_ban', '8', 'Number of strikes before 1-month question ban'),
('strikes_for_permanent_ban', '12', 'Number of strikes before permanent question ban'),

-- Strike values for different actions
('strike_value_downvote', '0.5', 'Strike value for a question downvote'),
('strike_value_closed', '2.0', 'Strike value for a closed question'),
('strike_value_deleted', '3.0', 'Strike value for a deleted question'),

-- Quality improvement thresholds
('improvement_min_score', '2', 'Minimum score to remove a strike from a question'),
('improvement_edit_required', 'true', 'Whether question must be edited to remove strike'),
('strikes_removed_per_improvement', '1', 'Number of strikes removed per improved question'),

-- Time windows
('strike_decay_days', '180', 'Days after which old strikes start to decay'),
('recent_questions_window', '30', 'Days to consider for recent question quality'),

-- Ban durations (in days)
('week_ban_duration', '7', 'Duration of week-level ban in days'),
('month_ban_duration', '30', 'Duration of month-level ban in days');
