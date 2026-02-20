const computerRentalService = require('../services/computerRentalService');
const membersService = require('../services/membersService');

const getActiveRentals = async (req, res) => {
    try {
        const rentals = await computerRentalService.getActiveRentals();
        res.json({ success: true, data: rentals });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const createRental = async (req, res) => {
    try {
        const { memberNo, pcNumber } = req.body;
        
        if (!memberNo || !pcNumber) {
            return res.status(400).json({ success: false, message: 'Member No and PC Number are required' });
        }

        // Validate member exists (optional, but good practice)
        const member = await membersService.getMemberByNo(memberNo);
        if (!member) {
            return res.status(404).json({ success: false, message: 'Member not found' });
        }

        const rental = await computerRentalService.createRental(memberNo, member.Fullname, pcNumber);
        res.status(201).json({ success: true, data: rental });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const completeRental = async (req, res) => {
    try {
        const { id } = req.params;
        const success = await computerRentalService.completeRental(id);
        
        if (!success) {
            return res.status(404).json({ success: false, message: 'Rental not found' });
        }
        
        res.json({ success: true, message: 'Rental completed' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getRentals = async (req, res) => {
    try {
        const rentals = await computerRentalService.getRentals();
        res.json({ success: true, data: rentals });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getActiveRentals,
    createRental,
    completeRental,
    getRentals
};
