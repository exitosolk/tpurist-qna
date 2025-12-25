-- OneCeylon Travel Q&A Database Schema

-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100),
  bio TEXT,
  avatar_url VARCHAR(500),
  location VARCHAR(100),
  website VARCHAR(255),
  reputation INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Questions table
CREATE TABLE questions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(300) NOT NULL,
  body TEXT NOT NULL,
  views INTEGER DEFAULT 0,
  score INTEGER DEFAULT 0,
  answer_count INTEGER DEFAULT 0,
  accepted_answer_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Answers table
CREATE TABLE answers (
  id SERIAL PRIMARY KEY,
  question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  is_accepted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tags table
CREATE TABLE tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  question_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Question tags junction table
CREATE TABLE question_tags (
  question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
  tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (question_id, tag_id)
);

-- Votes table (for both questions and answers)
CREATE TABLE votes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  votable_type VARCHAR(20) NOT NULL, -- 'question' or 'answer'
  votable_id INTEGER NOT NULL,
  vote_type INTEGER NOT NULL, -- 1 for upvote, -1 for downvote
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, votable_type, votable_id)
);

-- Comments table (for both questions and answers)
CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  commentable_type VARCHAR(20) NOT NULL, -- 'question' or 'answer'
  commentable_id INTEGER NOT NULL,
  body TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Badges table
CREATE TABLE badges (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  badge_type VARCHAR(20) NOT NULL, -- 'bronze', 'silver', 'gold'
  icon VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User badges junction table
CREATE TABLE user_badges (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  badge_id INTEGER REFERENCES badges(id) ON DELETE CASCADE,
  awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_questions_user_id ON questions(user_id);
CREATE INDEX idx_questions_created_at ON questions(created_at DESC);
CREATE INDEX idx_questions_score ON questions(score DESC);
CREATE INDEX idx_answers_question_id ON answers(question_id);
CREATE INDEX idx_answers_user_id ON answers(user_id);
CREATE INDEX idx_votes_user_votable ON votes(user_id, votable_type, votable_id);
CREATE INDEX idx_comments_commentable ON comments(commentable_type, commentable_id);
CREATE INDEX idx_question_tags_tag_id ON question_tags(tag_id);

-- Insert some default badges
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

-- Insert some default travel tags
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
