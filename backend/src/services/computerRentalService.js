const { dbApp } = require('../config/database');

// Get all active rentals (for PC status)
const getActiveRentals = async () => {
    try {
        const query = `
            SELECT * FROM computer_rentals 
            WHERE status = 'active'
        `;
        const [rows] = await dbApp.query(query);
        return rows;
    } catch (error) {
        throw error;
    }
};

// Create a new rental
const createRental = async (memberNo, memberName, pcNumber) => {
    try {
        // Check if PC is already occupied
        const checkQuery = `
            SELECT id FROM computer_rentals 
            WHERE pc_number = ? AND status = 'active'
        `;
        const [existing] = await dbApp.query(checkQuery, [pcNumber]);
        
        if (existing.length > 0) {
            throw new Error('PC is currently occupied');
        }

        const insertQuery = `
            INSERT INTO computer_rentals (member_no, member_name, pc_number)
            VALUES (?, ?, ?)
        `;
        const [result] = await dbApp.query(insertQuery, [memberNo, memberName, pcNumber]);
        
        return {
            id: result.insertId,
            memberNo,
            memberName,
            pcNumber,
            status: 'active',
            startTime: new Date()
        };
    } catch (error) {
        throw error;
    }
};

// Complete a rental
const completeRental = async (id) => {
    try {
        const query = `
            UPDATE computer_rentals 
            SET status = 'completed', end_time = NOW()
            WHERE id = ?
        `;
        const [result] = await dbApp.query(query, [id]);
        return result.affectedRows > 0;
    } catch (error) {
        throw error;
    }
};

// Get rental history (optional, or for list view)
const getRentals = async () => {
    try {
        const query = `SELECT * FROM computer_rentals ORDER BY created_at DESC LIMIT 50`;
        const [rows] = await dbApp.query(query);
        return rows;
    } catch (error) {
        throw error;
    }
};

module.exports = {
    getActiveRentals,
    createRental,
    completeRental,
    getRentals
};
