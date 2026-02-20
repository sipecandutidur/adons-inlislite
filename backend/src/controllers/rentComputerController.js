const rentComputerService = require('../services/rentComputerService');

const createRental = async (req, res) => {
    try {
        const { member_no, member_name, member_type, education, job, pc_number, notes } = req.body;

        if (!member_no || !member_name || !pc_number) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        const result = await rentComputerService.createRental({
            member_no,
            member_name,
            member_type,
            education,
            job,
            pc_number,
            notes
        });

        res.status(201).json({
            success: true,
            message: 'Rental created successfully',
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const getActiveRentals = async (req, res) => {
    try {
        const rentals = await rentComputerService.getActiveRentals();
        res.json({
            success: true,
            data: rentals
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const completeRental = async (req, res) => {
    try {
        const { id } = req.params;
        const success = await rentComputerService.completeRental(id);

        if (!success) {
            return res.status(404).json({
                success: false,
                message: 'Rental not found or already completed'
            });
        }

        res.json({
            success: true,
            message: 'Rental completed successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const getRentalHistory = async (req, res) => {
    try {
        const history = await rentComputerService.getRentalHistory();
        res.json({
            success: true,
            data: history
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const extendRental = async (req, res) => {
    try {
        const { minutes } = req.body;
        const success = await rentComputerService.extendRental(req.params.id, minutes);
        
        if (success) {
            res.json({
                success: true,
                message: 'Rental extended successfully'
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Rental not found'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    createRental,
    getActiveRentals,
    completeRental,
    getRentalHistory,
    extendRental
};
