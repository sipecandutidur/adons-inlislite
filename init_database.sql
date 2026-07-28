-- ================================================================
-- Template Import Database: alternative_inlislite
-- Adons Inlislite - Backend Application
-- ================================================================
-- File ini akan membuat database, user, dan semua tabel
-- yang dibutuhkan oleh backend application.
-- ================================================================

-- Buat database jika belum ada
CREATE DATABASE IF NOT EXISTS `alternative_inlislite`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `alternative_inlislite`;

-- ================================================================
-- SECURITY: Buat dedicated user untuk aplikasi (BUKAN root)
-- User ini hanya punya akses ke database alternative_inlislite
-- ================================================================

-- Healthcheck user (tanpa password, hanya bisa ping)
CREATE USER IF NOT EXISTS 'healthcheck'@'%' IDENTIFIED BY '';
GRANT USAGE ON *.* TO 'healthcheck'@'%';

-- Aplikasi user — hanya akses ke database ini
-- Password diset via MYSQL_PASSWORD environment variable di docker-compose
-- MySQL Docker image otomatis membuat MYSQL_USER dengan MYSQL_PASSWORD
-- dan memberikan ALL PRIVILEGES pada MYSQL_DATABASE

-- Hapus akses root dari remote (hanya localhost)
DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');

-- Hapus anonymous users
DELETE FROM mysql.user WHERE User='';

-- Hapus database test
DROP DATABASE IF EXISTS test;
DELETE FROM mysql.db WHERE Db='test' OR Db='test\\_%';

FLUSH PRIVILEGES;

-- ================================================================
-- 1. STOCK OPNAME SESSIONS
-- Menyimpan data sesi stock opname perpustakaan
-- ================================================================
CREATE TABLE IF NOT EXISTS `stock_opname_sessions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `pic_name` VARCHAR(255) NOT NULL,
    `rooms` JSON NOT NULL,
    `class_numbers` JSON NOT NULL,
    `status_buku` JSON NOT NULL,
    `status` ENUM('active', 'completed') DEFAULT 'active',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_pic_name` (`pic_name`),
    INDEX `idx_status` (`status`),
    INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 2. STOCK OPNAME ITEMS
-- Menyimpan item-item yang di-scan dalam sesi stock opname
-- ================================================================
CREATE TABLE IF NOT EXISTS `stock_opname_items` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `session_id` INT NOT NULL,
    `barcode` VARCHAR(50) NOT NULL,
    `title` TEXT,
    `author` TEXT,
    `call_number` VARCHAR(100),
    `year` VARCHAR(20),
    `type_procurement` VARCHAR(100),
    `source` VARCHAR(100),
    `location` VARCHAR(255),
    `status_buku` VARCHAR(100),
    `has_warning` BOOLEAN DEFAULT FALSE,
    `warning_types` JSON,
    `forced_add` BOOLEAN DEFAULT FALSE,
    `scanned_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`session_id`) REFERENCES `stock_opname_sessions`(`id`) ON DELETE CASCADE,
    INDEX `idx_session_id` (`session_id`),
    INDEX `idx_barcode` (`barcode`),
    INDEX `idx_scanned_at` (`scanned_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 3. BROKEN BOOKS
-- Menyimpan data buku rusak yang dilaporkan
-- (sudah termasuk kolom type_procurement & source dari migration 004)
-- ================================================================
CREATE TABLE IF NOT EXISTS `broken_books` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `barcode` VARCHAR(50) NOT NULL,
    `title` TEXT,
    `type_procurement` VARCHAR(100),
    `source` VARCHAR(100),
    `author` TEXT,
    `call_number` VARCHAR(100),
    `location` VARCHAR(255),
    `damage_type` ENUM('torn_pages', 'water_damage', 'missing_pages', 'cover_damage', 'binding_damage', 'other') NOT NULL,
    `damage_description` TEXT,
    `reported_by` VARCHAR(255) NOT NULL,
    `action_taken` ENUM('pending', 'under_repair', 'repaired', 'discarded') DEFAULT 'pending',
    `action_notes` TEXT,
    `notes` TEXT,
    `reported_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_barcode` (`barcode`),
    INDEX `idx_damage_type` (`damage_type`),
    INDEX `idx_action_taken` (`action_taken`),
    INDEX `idx_reported_at` (`reported_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 4. BROKEN BOOKS HISTORY
-- Menyimpan riwayat kerusakan buku dari waktu ke waktu
-- ================================================================
CREATE TABLE IF NOT EXISTS `broken_books_history` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `barcode` VARCHAR(20) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `author` VARCHAR(255),
    `call_number` VARCHAR(100),
    `location` VARCHAR(100),
    `damage_type` ENUM('torn_pages', 'water_damage', 'missing_pages', 'cover_damage', 'binding_damage', 'other') NOT NULL,
    `damage_description` TEXT NOT NULL,
    `reported_by` VARCHAR(100) NOT NULL,
    `action_taken` ENUM('pending', 'under_repair', 'repaired', 'discarded') DEFAULT 'pending',
    `action_notes` TEXT,
    `notes` TEXT,
    `reported_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `resolved_at` DATETIME,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_barcode` (`barcode`),
    INDEX `idx_reported_at` (`reported_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================================
-- 5. COMPUTER RENTALS
-- Menyimpan data peminjaman komputer oleh anggota
-- (sudah termasuk kolom member_type, education, job dari migration 006
--  dan kolom duration dari migration 007)
-- ================================================================
CREATE TABLE IF NOT EXISTS `computer_rentals` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `member_no` VARCHAR(50) NOT NULL,
    `member_name` VARCHAR(255) NOT NULL,
    `member_type` VARCHAR(100),
    `education` VARCHAR(100),
    `job` VARCHAR(100),
    `pc_number` INT NOT NULL,
    `duration` INT DEFAULT 120,
    `start_time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `end_time` TIMESTAMP NULL,
    `status` ENUM('active', 'completed') DEFAULT 'active',
    `notes` TEXT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_member_no` (`member_no`),
    INDEX `idx_status` (`status`),
    INDEX `idx_pc_number` (`pc_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================================
-- SETUP SELESAI
-- Database alternative_inlislite siap digunakan.
-- ================================================================
