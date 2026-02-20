-- Create computer_rentals table
CREATE TABLE IF NOT EXISTS computer_rentals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    member_no VARCHAR(50) NOT NULL,
    member_name VARCHAR(255) NOT NULL,
    member_type VARCHAR(100),
    education VARCHAR(100),
    job VARCHAR(100),
    pc_number INT NOT NULL,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP NULL,
    status ENUM('active', 'completed') DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_member_no (member_no),
    INDEX idx_status (status),
    INDEX idx_pc_number (pc_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
