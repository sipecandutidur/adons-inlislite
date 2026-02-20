-- Create broken_books_history table to track all damage records over time
CREATE TABLE IF NOT EXISTS broken_books_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  barcode VARCHAR(20) NOT NULL,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255),
  call_number VARCHAR(100),
  location VARCHAR(100),
  damage_type ENUM('torn_pages', 'water_damage', 'missing_pages', 'cover_damage', 'binding_damage', 'other') NOT NULL,
  damage_description TEXT NOT NULL,
  reported_by VARCHAR(100) NOT NULL,
  action_taken ENUM('pending', 'under_repair', 'repaired', 'discarded') DEFAULT 'pending',
  action_notes TEXT,
  notes TEXT,
  reported_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_barcode (barcode),
  INDEX idx_reported_at (reported_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
