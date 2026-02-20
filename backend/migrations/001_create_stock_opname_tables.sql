-- Stock Opname Sessions Table
CREATE TABLE IF NOT EXISTS stock_opname_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pic_name VARCHAR(255) NOT NULL,
    rooms JSON NOT NULL,
    class_numbers JSON NOT NULL,
    status_buku JSON NOT NULL,
    status ENUM('active', 'completed') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_pic_name (pic_name),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Stock Opname Items Table
CREATE TABLE IF NOT EXISTS stock_opname_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    barcode VARCHAR(50) NOT NULL,
    title TEXT,
    author TEXT,
    call_number VARCHAR(100),
    year VARCHAR(20),
    type_procurement VARCHAR(100),
    source VARCHAR(100),
    location VARCHAR(255),
    status_buku VARCHAR(100),
    has_warning BOOLEAN DEFAULT FALSE,
    warning_types JSON,
    forced_add BOOLEAN DEFAULT FALSE,
    scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES stock_opname_sessions(id) ON DELETE CASCADE,
    INDEX idx_session_id (session_id),
    INDEX idx_barcode (barcode),
    INDEX idx_scanned_at (scanned_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
