-- Create rate limits table to track user actions and prevent spam
-- Stores each action with timestamp to enable rate limiting checks

-- Drop existing tables if they exist to ensure clean setup
DROP TABLE IF EXISTS rate_limit_actions;
DROP TABLE IF EXISTS rate_limit_config;

CREATE TABLE rate_limit_actions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  action_type ENUM('question', 'answer', 'comment', 'vote', 'edit', 'flag') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes for efficient lookups
  INDEX idx_user_action (user_id, action_type, created_at),
  INDEX idx_created_at (created_at),
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create rate limit configuration table for flexible limits based on reputation
CREATE TABLE rate_limit_config (
  id INT AUTO_INCREMENT PRIMARY KEY,
  action_type ENUM('question', 'answer', 'comment', 'vote', 'edit', 'flag') NOT NULL,
  min_reputation INT NOT NULL DEFAULT 0,
  max_reputation INT DEFAULT NULL,
  max_actions INT NOT NULL,
  time_window_minutes INT NOT NULL,
  
  -- Description for admin reference
  description VARCHAR(255),
  
  UNIQUE KEY unique_action_reputation_window (action_type, min_reputation, max_reputation, time_window_minutes)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default rate limit configurations
-- These can be adjusted based on your community needs

-- Questions: More restrictive as they're high-value content
INSERT INTO rate_limit_config (action_type, min_reputation, max_reputation, max_actions, time_window_minutes, description) VALUES
('question', 0, 49, 3, 1440, 'New users: 3 questions per day'),
('question', 50, 499, 10, 1440, 'Established users: 10 questions per day'),
('question', 500, NULL, 20, 1440, 'Trusted users: 20 questions per day');

-- Answers: Moderately restrictive
INSERT INTO rate_limit_config (action_type, min_reputation, max_reputation, max_actions, time_window_minutes, description) VALUES
('answer', 0, 49, 10, 1440, 'New users: 10 answers per day'),
('answer', 50, 499, 30, 1440, 'Established users: 30 answers per day'),
('answer', 500, NULL, 50, 1440, 'Trusted users: 50 answers per day');

-- Comments: Less restrictive
INSERT INTO rate_limit_config (action_type, min_reputation, max_reputation, max_actions, time_window_minutes, description) VALUES
('comment', 0, 49, 20, 1440, 'New users: 20 comments per day'),
('comment', 50, 499, 50, 1440, 'Established users: 50 comments per day'),
('comment', 500, NULL, 100, 1440, 'Trusted users: 100 comments per day');

-- Votes: Very lenient
INSERT INTO rate_limit_config (action_type, min_reputation, max_reputation, max_actions, time_window_minutes, description) VALUES
('vote', 0, 49, 30, 1440, 'New users: 30 votes per day'),
('vote', 50, 499, 60, 1440, 'Established users: 60 votes per day'),
('vote', 500, NULL, 100, 1440, 'Trusted users: 100 votes per day');

-- Edits: Moderate limits
INSERT INTO rate_limit_config (action_type, min_reputation, max_reputation, max_actions, time_window_minutes, description) VALUES
('edit', 0, 49, 5, 1440, 'New users: 5 edits per day'),
('edit', 50, 499, 20, 1440, 'Established users: 20 edits per day'),
('edit', 500, NULL, 50, 1440, 'Trusted users: 50 edits per day');

-- Flags: Restrictive to prevent abuse
INSERT INTO rate_limit_config (action_type, min_reputation, max_reputation, max_actions, time_window_minutes, description) VALUES
('flag', 0, 49, 5, 1440, 'New users: 5 flags per day'),
('flag', 50, 499, 15, 1440, 'Established users: 15 flags per day'),
('flag', 500, NULL, 30, 1440, 'Trusted users: 30 flags per day');

-- Additional short-term rate limits to prevent rapid-fire spam
INSERT INTO rate_limit_config (action_type, min_reputation, max_reputation, max_actions, time_window_minutes, description) VALUES
('question', 0, 49, 1, 15, 'New users: Max 1 question per 15 minutes'),
('answer', 0, 49, 3, 15, 'New users: Max 3 answers per 15 minutes'),
('comment', 0, 49, 5, 15, 'New users: Max 5 comments per 15 minutes');
