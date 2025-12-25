-- OneCeylon Travel Q&A Database Schema (MySQL)

-- Users table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100),
  bio TEXT,
  avatar_url VARCHAR(500),
  location VARCHAR(100),
  website VARCHAR(255),
  reputation INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Questions table
CREATE TABLE questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(300) NOT NULL,
  body TEXT NOT NULL,
  views INT DEFAULT 0,
  score INT DEFAULT 0,
  answer_count INT DEFAULT 0,
  accepted_answer_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at DESC),
  INDEX idx_score (score DESC),
  INDEX idx_last_activity (last_activity_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Answers table
CREATE TABLE answers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  question_id INT NOT NULL,
  user_id INT NOT NULL,
  body TEXT NOT NULL,
  score INT DEFAULT 0,
  is_accepted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_question_id (question_id),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tags table
CREATE TABLE tags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  question_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_name (name),
  INDEX idx_question_count (question_count DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Question tags junction table
CREATE TABLE question_tags (
  question_id INT NOT NULL,
  tag_id INT NOT NULL,
  PRIMARY KEY (question_id, tag_id),
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
  INDEX idx_tag_id (tag_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Votes table (for both questions and answers)
CREATE TABLE votes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  votable_type VARCHAR(20) NOT NULL,
  votable_id INT NOT NULL,
  vote_type INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_vote (user_id, votable_type, votable_id),
  INDEX idx_votable (votable_type, votable_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Comments table (for both questions and answers)
CREATE TABLE comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  commentable_type VARCHAR(20) NOT NULL,
  commentable_id INT NOT NULL,
  body TEXT NOT NULL,
  score INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_commentable (commentable_type, commentable_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Badges table
CREATE TABLE badges (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  badge_type VARCHAR(20) NOT NULL,
  icon VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User badges junction table
CREATE TABLE user_badges (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  badge_id INT NOT NULL,
  awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_badge_id (badge_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default badges
INSERT INTO badges (name, description, badge_type, icon) VALUES
  ('First Question', 'Asked your first question', 'bronze', '❓'),
  ('First Answer', 'Posted your first answer', 'bronze', '✍️'),
  ('Helpful', 'Received 10 upvotes on an answer', 'silver', '👍'),
  ('Expert', 'Received 100 upvotes on an answer', 'gold', '🏆'),
  ('Popular Question', 'Question viewed 1000 times', 'silver', '👀'),
  ('Great Question', 'Question received 25 upvotes', 'gold', '⭐'),
  ('Contributor', 'Answered 10 questions', 'bronze', '💡'),
  ('Enthusiast', 'Visited the site each day for 30 consecutive days', 'silver', '🔥'),
  ('Travel Guide', 'Reputation reached 1000', 'gold', '🗺️'),
  ('Local Expert', 'Posted 5 accepted answers about a specific destination', 'gold', '🎖️');

-- Insert default travel tags
INSERT INTO tags (name, description) VALUES
  ('colombo', 'Questions about Colombo, the commercial capital'),
  ('kandy', 'Questions about Kandy and the cultural triangle'),
  ('galle', 'Questions about Galle and the southern coast'),
  ('ella', 'Questions about Ella and the hill country'),
  ('sigiriya', 'Questions about Sigiriya rock fortress'),
  ('beaches', 'Beach-related travel questions'),
  ('wildlife', 'Wildlife and safari questions'),
  ('food', 'Sri Lankan cuisine and restaurants'),
  ('culture', 'Cultural sites and traditions'),
  ('hiking', 'Trekking and hiking trails'),
  ('tea-country', 'Tea plantations and hill country'),
  ('budget-travel', 'Budget-friendly travel tips'),
  ('transportation', 'Getting around Sri Lanka'),
  ('accommodation', 'Hotels, guesthouses, and stays'),
  ('safety', 'Safety and travel precautions'),
  ('visa', 'Visa and entry requirements'),
  ('festivals', 'Local festivals and events'),
  ('photography', 'Photography spots and tips'),
  ('surfing', 'Surfing destinations and conditions'),
  ('ayurveda', 'Ayurvedic treatments and spas');
