-- Create scam_reports table for community-reported scams
CREATE TABLE IF NOT EXISTS scam_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tag VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  severity ENUM('low', 'medium', 'high') DEFAULT 'medium',
  upvotes INT DEFAULT 0,
  reported_by INT NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (reported_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_tag (tag),
  INDEX idx_verified (verified),
  INDEX idx_upvotes (upvotes)
);

-- Create scam_report_votes table to track user votes
CREATE TABLE IF NOT EXISTS scam_report_votes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  scam_report_id INT NOT NULL,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (scam_report_id) REFERENCES scam_reports(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_vote (scam_report_id, user_id),
  INDEX idx_scam_report (scam_report_id),
  INDEX idx_user (user_id)
);

-- Insert some sample scam reports for popular tags
INSERT INTO scam_reports (tag, title, description, severity, upvotes, reported_by, verified) VALUES
('Colombo', 'Overpriced "Government" TukTuk Drivers', 'Drivers claiming to be "government-approved" and charging 3-5x normal rates. Always negotiate or use meter.', 'high', 15, 1, TRUE),
('Colombo', 'Gem Shop Scam', 'TukTuk drivers taking tourists to overpriced gem shops for commission. Politely decline and stick to your itinerary.', 'high', 12, 1, TRUE),
('TukTuk', 'Broken Meter Scam', 'Driver claims meter is broken and quotes inflated price. Insist on meter or negotiate BEFORE starting ride.', 'high', 20, 1, TRUE),
('TukTuk', 'Long Route Scam', 'Driver takes unnecessarily long routes to increase fare. Use Google Maps to track your route.', 'medium', 8, 1, TRUE),
('Kandy', 'Temple Donation Pressure', 'Unofficial "guides" at temples pressuring large donations. Official temple donations are optional and modest.', 'medium', 6, 1, TRUE),
('Galle', 'Beach Restaurant Overcharging', 'Some beach restaurants don''t display prices and overcharge tourists. Always ask for menu with prices first.', 'medium', 5, 1, TRUE);
