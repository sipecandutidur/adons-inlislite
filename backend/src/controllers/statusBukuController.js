const statusBukuService = require('../services/statusBukuService');

const getAllStatusBuku = async (req, res) => {
    try {
        const statusBuku = await statusBukuService.getAllStatusBuku();
        res.json({
            success: true,
            data: statusBuku.map(statusBuku => statusBuku.Name)
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch status buku'
        });
    }
};

module.exports = {
    getAllStatusBuku
};