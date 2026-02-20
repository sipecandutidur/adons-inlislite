const { dbApp } = require('../config/database');
const { getMembersByNos } = require('./membersService');

const createRental = async ({ member_no, member_name, member_type, education, job, pc_number, notes, duration = 120 }) => {
    try {
        // Check if PC is already occupied
        const [existing] = await dbApp.query(
            "SELECT * FROM computer_rentals WHERE pc_number = ? AND status = 'active'",
            [pc_number]
        );

        if (existing.length > 0) {
            return { success: false, message: 'PC is already occupied' };
        }

        // Create new rental
        const [result] = await dbApp.query(
            "INSERT INTO computer_rentals (member_no, member_name, member_type, education, job, pc_number, notes, duration) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [member_no, member_name, member_type, education, job, pc_number, notes, duration]
        );

        return {
            id: result.insertId,
            member_no,
            member_name,
            member_type,
            education,
            job,
            pc_number,
            notes,
            duration,
            status: 'active',
            start_time: new Date()
        };
    } catch (error) {
        throw error;
    }
};

const getActiveRentals = async () => {
    try {
        const [rows] = await dbApp.query(
            "SELECT * FROM computer_rentals WHERE status = 'active' ORDER BY pc_number ASC"
        );
        return rows;
    } catch (error) {
        throw error;
    }
};

const completeRental = async (id) => {
    try {
        const [result] = await dbApp.query(
            "UPDATE computer_rentals SET status = 'completed', end_time = NOW() WHERE id = ?",
            [id]
        );
        return result.affectedRows > 0;
    } catch (error) {
        throw error;
    }
}

const extendRental = async (id, additionalMinutes) => {
    try {
        const [result] = await dbApp.query(
            "UPDATE computer_rentals SET duration = duration + ? WHERE id = ?",
            [additionalMinutes, id]
        );
        return result.affectedRows > 0;
    } catch (error) {
        throw error;
    }
}

const getRentalHistory = async () => {
    try {
        const [rows] = await dbApp.query(
            "SELECT * FROM computer_rentals ORDER BY created_at DESC"
        );

        if (rows.length === 0) {
            return [];
        }

        const memberNos = [...new Set(rows.map(row => row.member_no).filter(Boolean))];
        const memberDetails = await getMembersByNos(memberNos);
        
        const memberMap = memberDetails.reduce((acc, member) => {
            acc[member.MemberNo] = member;
            return acc;
        }, {});

        const mergedRows = rows.map(row => ({
            ...row,
            ...memberMap[row.member_no]
        }));

        return mergedRows;
    } catch (error) {
        throw error;
    }
};

module.exports = {
    createRental,
    getActiveRentals,
    completeRental,
    getRentalHistory,
    extendRental
};
