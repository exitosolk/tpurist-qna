-- Badge System Database Schema
-- Bronze Tier: User Activation focused badges

-- Main badges definition table
CREATE TABLE IF NOT EXISTS badges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    tier VARCHAR(50) NOT NULL DEFAULT 'bronze', -- 'bronze', 'silver', 'gold'
    description TEXT NOT NULL,
    icon VARCHAR(255), -- emoji or icon path
    notification_message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_tier (tier)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add missing columns for existing badges table (ignore errors if columns exist)
-- If you get "Duplicate column" errors, it's safe to ignore them
ALTER TABLE badges ADD COLUMN tier VARCHAR(50) NOT NULL DEFAULT 'bronze' AFTER name;
ALTER TABLE badges ADD COLUMN description TEXT NOT NULL AFTER tier;
ALTER TABLE badges ADD COLUMN icon VARCHAR(255) AFTER description;
ALTER TABLE badges ADD COLUMN notification_message TEXT NOT NULL AFTER icon;
ALTER TABLE badges ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER notification_message;
ALTER TABLE badges ADD INDEX idx_tier (tier);

-- User badges (many-to-many relationship)
CREATE TABLE IF NOT EXISTS user_badges (
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

-- Badge progress tracking (for incremental badges like "10 upvotes")
CREATE TABLE IF NOT EXISTS badge_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    badge_id INT NOT NULL,
    progress INT DEFAULT 0, -- current progress value
    target INT NOT NULL, -- target value to earn badge
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_badge_progress (user_id, badge_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert Bronze Tier badges
INSERT IGNORE INTO badges (name, tier, description, icon, notification_message) VALUES
(
    'Ayubowan',
    'bronze',
    'Verified your email and completed your profile. Welcome to the community!',
    '🙏',
    'Ayubowan! 🙏 You''ve officially arrived. Your profile is set up and ready for the island.'
),
(
    'First Landing',
    'bronze',
    'Asked your first question that received community engagement.',
    '🛬',
    'Touchdown! 🛬 You just asked your first question. The community is looking into it now!'
),
(
    'Rice & Curry',
    'bronze',
    'Cast 10 upvotes on questions and answers. You''re helping the community grow!',
    '🍛',
    'A staple of the island! 🍛 Thanks for helping us sort the good advice from the bad. Keep voting!'
),
(
    'Snapshot',
    'bronze',
    'Shared a photo that received 5 upvotes. Your visual contribution is valued!',
    '📸',
    'Picture Perfect! 📸 5 people loved your shot. You''re making the island look good.'
);

-- Initialize progress tracking for Rice & Curry badge (requires 10 upvotes)
-- This will be populated dynamically as users cast votes
