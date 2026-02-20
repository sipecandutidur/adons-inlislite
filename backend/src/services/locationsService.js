const { dbInlislite } = require('../config/database');

const getAllLocations = async () => {
    try {
        const query = `SELECT * FROM locations`;
        const [rows] = await dbInlislite.query(query);
        return rows;
    } catch (error) {
        console.error('Error fetching locations:', error);
        throw error;
    }
};

module.exports = {
    getAllLocations
};