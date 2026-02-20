-- Add duration column to computer_rentals table
ALTER TABLE computer_rentals ADD COLUMN duration INT DEFAULT 120 AFTER pc_number;
