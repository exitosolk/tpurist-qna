-- Create notification preferences table for user-specific notification settings
-- Users can control which types of notifications they want to receive

CREATE TABLE IF NOT EXISTS notification_preferences (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  
  -- Email notification preferences
  email_new_answer BOOLEAN DEFAULT TRUE,
  email_new_comment BOOLEAN DEFAULT TRUE,
  email_question_upvote BOOLEAN DEFAULT FALSE,
  email_question_downvote BOOLEAN DEFAULT FALSE,
  email_answer_upvote BOOLEAN DEFAULT TRUE,
  email_answer_downvote BOOLEAN DEFAULT FALSE,
  email_accepted_answer BOOLEAN DEFAULT TRUE,
  email_badge_earned BOOLEAN DEFAULT TRUE,
  email_followed_question BOOLEAN DEFAULT TRUE,
  
  -- In-app notification preferences
  app_new_answer BOOLEAN DEFAULT TRUE,
  app_new_comment BOOLEAN DEFAULT TRUE,
  app_question_upvote BOOLEAN DEFAULT TRUE,
  app_question_downvote BOOLEAN DEFAULT TRUE,
  app_answer_upvote BOOLEAN DEFAULT TRUE,
  app_answer_downvote BOOLEAN DEFAULT TRUE,
  app_accepted_answer BOOLEAN DEFAULT TRUE,
  app_badge_earned BOOLEAN DEFAULT TRUE,
  app_followed_question BOOLEAN DEFAULT TRUE,
  
  -- Digest preferences
  digest_frequency ENUM('none', 'daily', 'weekly') DEFAULT 'weekly',
  digest_include_new_questions BOOLEAN DEFAULT TRUE,
  digest_include_top_questions BOOLEAN DEFAULT TRUE,
  digest_include_followed_tags BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_preferences (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
