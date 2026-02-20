-- Broken Books Table
CREATE TABLE IF NOT EXISTS broken_books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    barcode VARCHAR(50) NOT NULL,
    title TEXT,
    author TEXT,
    call_number VARCHAR(100),
    location VARCHAR(255),
    damage_type ENUM('torn_pages', 'water_damage', 'missing_pages', 'cover_damage', 'binding_damage', 'other') NOT NULL,
    damage_description TEXT,
    reported_by VARCHAR(255) NOT NULL,
    action_taken ENUM('pending', 'under_repair', 'repaired', 'discarded') DEFAULT 'pending',
    action_notes TEXT,
    notes TEXT,
    reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_barcode (barcode),
    INDEX idx_damage_type (damage_type),
    INDEX idx_action_taken (action_taken),
    INDEX idx_reported_at (reported_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
