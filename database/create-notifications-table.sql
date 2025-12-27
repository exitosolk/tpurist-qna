-- Create notifications table for real-time user notifications
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type ENUM('answer', 'question_upvote', 'question_downvote', 'answer_upvote', 'answer_downvote', 'comment', 'accepted_answer') NOT NULL,
  actor_id INT,
  question_id INT,
  answer_id INT,
  comment_id INT,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  FOREIGN KEY (answer_id) REFERENCES answers(id) ON DELETE CASCADE,
  INDEX idx_user_read (user_id, is_read),
  INDEX idx_user_created (user_id, created_at),
  INDEX idx_created (created_at)
);
