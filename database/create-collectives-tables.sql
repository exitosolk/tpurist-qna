-- Create collectives table for travel-focused communities
CREATE TABLE IF NOT EXISTS collectives (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon_url VARCHAR(255),
  cover_image_url VARCHAR(255),
  member_count INT DEFAULT 0,
  question_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_slug (slug)
);

-- Create collective_members table for users who join collectives
CREATE TABLE IF NOT EXISTS collective_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  collective_id INT NOT NULL,
  user_id INT NOT NULL,
  role ENUM('member', 'moderator', 'admin') DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (collective_id) REFERENCES collectives(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_membership (collective_id, user_id),
  INDEX idx_user_collectives (user_id),
  INDEX idx_collective_members (collective_id)
);

-- Create collective_questions table for questions tagged to collectives
CREATE TABLE IF NOT EXISTS collective_questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  collective_id INT NOT NULL,
  question_id INT NOT NULL,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (collective_id) REFERENCES collectives(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  UNIQUE KEY unique_collective_question (collective_id, question_id),
  INDEX idx_collective_questions (collective_id),
  INDEX idx_question_collectives (question_id)
);

-- Insert some initial travel-focused collectives for OneCeylon
INSERT INTO collectives (name, slug, description) VALUES
('Colombo Travel', 'colombo-travel', 'Everything about traveling in and around Colombo - Sri Lanka''s vibrant capital city. From street food to shopping, nightlife to historical sites.'),
('Kandy & Hill Country', 'kandy-hill-country', 'Explore the cultural capital and the beautiful hill country. Tea plantations, temples, cool climate, and scenic train rides.'),
('Beaches & Coastal Areas', 'beaches-coastal', 'Sun, sand, and surf! Discover Sri Lanka''s pristine beaches, water sports, coastal towns, and marine life.'),
('Adventure & Wildlife', 'adventure-wildlife', 'For thrill-seekers and nature lovers. Safaris, hiking, whale watching, diving, and wildlife encounters across Sri Lanka.'),
('Cultural Heritage', 'cultural-heritage', 'Ancient cities, UNESCO sites, temples, festivals, and the rich cultural tapestry of Sri Lanka.'),
('Food & Culinary Tours', 'food-culinary', 'Sri Lankan cuisine, street food, cooking classes, and the best places to eat across the island.'),
('Budget Travel', 'budget-travel', 'Tips and tricks for exploring Sri Lanka on a budget. Affordable accommodations, cheap eats, and money-saving advice.'),
('Luxury & Wellness', 'luxury-wellness', 'High-end resorts, spa retreats, ayurveda treatments, and premium travel experiences in Sri Lanka.');
