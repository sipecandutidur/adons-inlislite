const brokenBookService = require('../services/brokenBookService');

// Report broken book
const reportBrokenBook = async (req, res) => {
    try {
        const {
            barcode,
            title,
            author,
            callNumber,
            location,
            damageType,
            damageDescription,
            reportedBy,
            notes,
            typeProcurement,
            source
        } = req.body;
        
        // Validation
        if (!barcode || !damageType || !reportedBy) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: barcode, damageType, reportedBy'
            });
        }
        
        const book = await brokenBookService.reportBrokenBook({
            barcode,
            title,
            author,
            callNumber,
            location,
            damageType,
            damageDescription,
            reportedBy,
            notes,
            typeProcurement,
            source
        });
        
        res.status(201).json({
            success: true,
            message: 'Broken book reported successfully',
            data: book
        });
    } catch (error) {
        console.error('Error reporting broken book:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to report broken book',
            error: error.message
        });
    }
};

// Check duplicate
const checkDuplicate = async (req, res) => {
    try {
        const { barcode } = req.params;
        
        if (!barcode) {
            return res.status(400).json({
                success: false,
                message: 'Barcode is required'
            });
        }
        
        const result = await brokenBookService.checkDuplicate(barcode);
        
        res.json({
            success: true,
            isDuplicate: result.isDuplicate,
            data: result.data
        });
    } catch (error) {
        console.error('Error checking duplicate:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check duplicate',
            error: error.message
        });
    }
};

// Get all broken books
const getAllBrokenBooks = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const search = req.query.search || '';
        const damageType = req.query.damageType || '';
        const actionStatus = req.query.actionStatus || '';
        
        const result = await brokenBookService.getAllBrokenBooks(
            page,
            limit,
            search,
            damageType,
            actionStatus
        );
        
        res.json({
            success: true,
            data: result.books,
            pagination: result.pagination
        });
    } catch (error) {
        console.error('Error getting broken books:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get broken books',
            error: error.message
        });
    }
};

// Get broken book by ID
const getBrokenBookById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const book = await brokenBookService.getBrokenBookById(id);
        
        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Broken book not found'
            });
        }
        
        res.json({
            success: true,
            data: book
        });
    } catch (error) {
        console.error('Error getting broken book:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get broken book',
            error: error.message
        });
    }
};

// Update action
const updateAction = async (req, res) => {
    try {
        const { id } = req.params;
        const { actionTaken, actionNotes } = req.body;
        
        if (!actionTaken) {
            return res.status(400).json({
                success: false,
                message: 'actionTaken is required'
            });
        }
        
        const validActions = ['pending', 'under_repair', 'repaired', 'discarded'];
        if (!validActions.includes(actionTaken)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid actionTaken value'
            });
        }
        
        const success = await brokenBookService.updateAction(id, {
            actionTaken,
            actionNotes
        });
        
        if (!success) {
            return res.status(404).json({
                success: false,
                message: 'Broken book not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Action updated successfully'
        });
    } catch (error) {
        console.error('Error updating action:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update action',
            error: error.message
        });
    }
};

// Get damage history for a barcode
const getHistory = async (req, res) => {
    try {
        const { barcode } = req.params;
        
        if (!barcode) {
            return res.status(400).json({
                success: false,
                message: 'Barcode is required'
            });
        }
        
        const history = await brokenBookService.getHistory(barcode);
        const count = await brokenBookService.getHistoryCount(barcode);
        
        res.json({
            success: true,
            data: history,
            count: count
        });
    } catch (error) {
        console.error('Error getting history:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get history',
            error: error.message
        });
    }
};

// Get statistics
const getStatistics = async (req, res) => {
    try {
        const stats = await brokenBookService.getStatistics();
        
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error getting statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get statistics',
            error: error.message
        });
    }
};

module.exports = {
    reportBrokenBook,
    checkDuplicate,
    getAllBrokenBooks,
    getBrokenBookById,
    updateAction,
    getStatistics,
    getHistory
};
