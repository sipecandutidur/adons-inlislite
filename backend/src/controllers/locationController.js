const locationsService = require('../services/locationsService');

const getAllLocations = async (req, res) => {
    try {
        const locations = await locationsService.getAllLocations();
        res.json({
            success: true,
            data: locations.map(location => location.Name)
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch locations'
        });
    }
};

module.exports = {
    getAllLocations
};