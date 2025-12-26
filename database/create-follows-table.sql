-- Create follows table for bookmarking answers
CREATE TABLE IF NOT EXISTS follows (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  followable_type ENUM('question', 'answer') NOT NULL,
  followable_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_follow (user_id, followable_type, followable_id),
  INDEX idx_user_follows (user_id),
  INDEX idx_followable (followable_type, followable_id)
);
