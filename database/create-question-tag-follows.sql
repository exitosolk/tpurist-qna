-- Question Follows Table
-- For users to actively follow questions and receive notifications about new answers
-- This is separate from the "follows" table which is used for bookmarking

CREATE TABLE IF NOT EXISTS question_follows (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  question_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  UNIQUE KEY unique_question_follow (user_id, question_id),
  INDEX idx_user_follows (user_id),
  INDEX idx_question_followers (question_id),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tag Follows Table
-- For users to follow specific tags and receive notifications about new questions with those tags

CREATE TABLE IF NOT EXISTS tag_follows (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  tag_name VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_tag_follow (user_id, tag_name),
  INDEX idx_user_tag_follows (user_id),
  INDEX idx_tag_followers (tag_name),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add new notification types for follows
ALTER TABLE notifications 
MODIFY COLUMN type ENUM(
  'answer', 
  'question_upvote', 
  'question_downvote', 
  'answer_upvote', 
  'answer_downvote', 
  'comment', 
  'accepted_answer',
  'followed_question_answer',  -- New answer on a followed question
  'followed_tag_question',      -- New question with a followed tag
  'badge_earned'
) NOT NULL;
