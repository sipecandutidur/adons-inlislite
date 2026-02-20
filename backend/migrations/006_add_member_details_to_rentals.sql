-- Add member details columns to computer_rentals table
-- ALREADY APPLIED. Commenting out to prevent duplicate column error.
/*
ALTER TABLE computer_rentals
ADD COLUMN member_type VARCHAR(100) AFTER member_name,
ADD COLUMN education VARCHAR(100) AFTER member_type,
ADD COLUMN job VARCHAR(100) AFTER education;
*/
