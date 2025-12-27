-- Create reputation_history table to track all reputation changes
CREATE TABLE IF NOT EXISTS reputation_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  change_amount INT NOT NULL,
  reason VARCHAR(255) NOT NULL,
  reference_type ENUM('question', 'answer', 'accepted_answer', 'email_verification', 'vote', 'downvote') NOT NULL,
  reference_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_created (user_id, created_at DESC)
);
