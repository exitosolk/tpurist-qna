-- Create tuktuk_prices table for price reporting
CREATE TABLE IF NOT EXISTS tuktuk_prices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  start_location VARCHAR(255) NOT NULL,
  end_location VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'LKR',
  date_of_travel DATE NOT NULL,
  additional_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_route (start_location, end_location),
  INDEX idx_date (date_of_travel),
  INDEX idx_user (user_id)
);
