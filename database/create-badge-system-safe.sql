-- Badge System Database Schema
-- Clean installation - drops existing tables and recreates them

-- Drop tables in correct order (child tables first due to foreign keys)
DROP TABLE IF EXISTS badge_progress;
DROP TABLE IF EXISTS user_badges;
DROP TABLE IF EXISTS badges;

-- Create badges table with complete schema
CREATE TABLE badges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    tier VARCHAR(50) NOT NULL DEFAULT 'bronze',
    description TEXT NOT NULL,
    icon VARCHAR(255),
    notification_message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_tier (tier)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_badges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    badge_id INT NOT NULL,
    awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_badge (user_id, badge_id),
    INDEX idx_user_id (user_id),
    INDEX idx_awarded_at (awarded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE badge_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    badge_id INT NOT NULL,
    progress INT DEFAULT 0,
    target INT NOT NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_badge_progress (user_id, badge_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert Bronze Tier badges
INSERT INTO badges (name, tier, description, icon, notification_message) VALUES
('Ayubowan', 'bronze', 'Verified your email and completed your profile. Welcome to the community!', '🙏', 'Ayubowan! 🙏 You''ve officially arrived. Your profile is set up and ready for the island.'),
('First Landing', 'bronze', 'Asked your first question that received community engagement.', '🛬', 'Touchdown! 🛬 You just asked your first question. The community is looking into it now!'),
('Rice & Curry', 'bronze', 'Cast 10 upvotes on questions and answers. You''re helping the community grow!', '🍛', 'A staple of the island! 🍛 Thanks for helping us sort the good advice from the bad. Keep voting!'),
('Snapshot', 'bronze', 'Shared a photo that received 5 upvotes. Your visual contribution is valued!', '📸', 'Picture Perfect! 📸 5 people loved your shot. You''re making the island look good.');
