const { dbInlislite } = require('../config/database');

const getAllStatusBuku = async () => {
    try {
        const query = `SELECT * FROM collectionstatus`;
        const [rows] = await dbInlislite.query(query);
        return rows;
    } catch (error) {
        console.error('Error fetching status buku:', error);
        throw error;
    }
};

module.exports = {
    getAllStatusBuku
};