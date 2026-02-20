const membersService = require('../services/membersService');

const getAllMembers = async (req, res) => {
    try {
        const result = await membersService.getAllMembers(req.query.page, req.query.limit);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch members'
        });
    }
};

const getMemberById = async (req, res) => {
    try {
        const result = await membersService.getMemberById(req.params.noMember);
        if (!result.success) {
            return res.status(404).json(result);
        }
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch member'
        });
    }
};

module.exports = {
    getAllMembers,
    getMemberById
};