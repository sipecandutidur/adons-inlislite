-- Migration 004: Add procurement source to broken books
-- This migration is commented out because it has already been applied in the current environment
-- and causes duplicate column errors.
-- Original content preserved below for reference:

/*
-- Add type_procurement column to broken_books table
ALTER TABLE broken_books
ADD COLUMN type_procurement VARCHAR(100) AFTER title;

-- Add source column to broken_books table
ALTER TABLE broken_books
ADD COLUMN source VARCHAR(100) AFTER type_procurement;

-- Add type_procurement and source to broken_books_history table
-- ALTER TABLE broken_books_history
-- ADD COLUMN type_procurement VARCHAR(100) AFTER title,
-- ADD COLUMN source VARCHAR(100) AFTER type_procurement;
*/
