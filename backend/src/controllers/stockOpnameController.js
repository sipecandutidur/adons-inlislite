const stockOpnameService = require('../services/stockOpnameService');

// Create new session
const createSession = async (req, res) => {
    try {
        const { picName, rooms, classNumbers, statusBuku } = req.body;
        
        // Validation
        if (!picName || !rooms || !classNumbers || !statusBuku) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: picName, rooms, classNumbers, statusBuku'
            });
        }
        
        if (!Array.isArray(rooms) || !Array.isArray(classNumbers) || !Array.isArray(statusBuku)) {
            return res.status(400).json({
                success: false,
                message: 'rooms, classNumbers, and statusBuku must be arrays'
            });
        }
        
        if (rooms.length === 0 || classNumbers.length === 0 || statusBuku.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'rooms, classNumbers, and statusBuku cannot be empty'
            });
        }
        
        const session = await stockOpnameService.createSession({
            picName,
            rooms,
            classNumbers,
            statusBuku
        });
        
        if (req.app.get('io')) {
            req.app.get('io').emit('STOCK_OPNAME_UPDATED');
        }
        
        res.status(201).json({
            success: true,
            message: 'Session created successfully',
            data: session
        });
    } catch (error) {
        console.error('Error creating session:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create session',
            error: error.message
        });
    }
};

// Check duplicate barcode
const checkDuplicate = async (req, res) => {
    try {
        const { barcode } = req.params;
        
        if (!barcode) {
            return res.status(400).json({
                success: false,
                message: 'Barcode is required'
            });
        }
        
        const result = await stockOpnameService.checkDuplicate(barcode);
        
        res.json({
            success: true,
            data: {
                isDuplicate: result.isDuplicate,
                data: result.data
            }
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

// Add item to session
const addItemToSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const itemData = req.body;
        
        // Validation
        if (!itemData.barcode) {
            return res.status(400).json({
                success: false,
                message: 'Barcode is required'
            });
        }
        
        const item = await stockOpnameService.addItemToSession(sessionId, itemData);
        
        if (req.app.get('io')) {
            req.app.get('io').emit('STOCK_OPNAME_UPDATED');
        }
        
        res.status(201).json({
            success: true,
            message: 'Item added successfully',
            data: item
        });
    } catch (error) {
        console.error('Error adding item:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add item',
            error: error.message
        });
    }
};

// Get session by ID
const getSessionById = async (req, res) => {
    try {
        const { sessionId } = req.params;
        
        const session = await stockOpnameService.getSessionById(sessionId);
        
        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session not found'
            });
        }
        
        res.json({
            success: true,
            data: session
        });
    } catch (error) {
        console.error('Error getting session:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get session',
            error: error.message
        });
    }
};

// Get all sessions
const getAllSessions = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        
        const result = await stockOpnameService.getAllSessions(page, limit);
        
        res.json({
            success: true,
            data: result.sessions,
            pagination: result.pagination
        });
    } catch (error) {
        console.error('Error getting sessions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get sessions',
            error: error.message
        });
    }
};

// Update session profile
const updateSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { picName, rooms, classNumbers, statusBuku } = req.body;
        
        // Validation
        if (!picName || !rooms || !classNumbers || !statusBuku) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: picName, rooms, classNumbers, statusBuku'
            });
        }
        
        if (!Array.isArray(rooms) || !Array.isArray(classNumbers) || !Array.isArray(statusBuku)) {
            return res.status(400).json({
                success: false,
                message: 'rooms, classNumbers, and statusBuku must be arrays'
            });
        }
        
        const success = await stockOpnameService.updateSession(sessionId, {
            picName,
            rooms,
            classNumbers,
            statusBuku
        });
        
        if (!success) {
            return res.status(404).json({
                success: false,
                message: 'Session not found'
            });
        }
        
        if (req.app.get('io')) {
            req.app.get('io').emit('STOCK_OPNAME_UPDATED');
        }
        
        res.json({
            success: true,
            message: 'Session updated successfully'
        });
    } catch (error) {
        console.error('Error updating session:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update session',
            error: error.message
        });
    }
};

// Complete session
const completeSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        
        const success = await stockOpnameService.completeSession(sessionId);
        
        if (!success) {
            return res.status(404).json({
                success: false,
                message: 'Session not found'
            });
        }
        
        if (req.app.get('io')) {
            req.app.get('io').emit('STOCK_OPNAME_UPDATED');
        }
        
        res.json({
            success: true,
            message: 'Session completed successfully'
        });
    } catch (error) {
        console.error('Error completing session:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to complete session',
            error: error.message
        });
    }
};

// Delete session
const deleteSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        
        const success = await stockOpnameService.deleteSession(sessionId);
        
        if (!success) {
            return res.status(404).json({
                success: false,
                message: 'Session not found'
            });
        }
        
        if (req.app.get('io')) {
            req.app.get('io').emit('STOCK_OPNAME_UPDATED');
        }
        
        res.json({
            success: true,
            message: 'Session deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting session:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete session',
            error: error.message
        });
    }
};

// Get all scanned items across all sessions
const getAllScannedItems = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const search = req.query.search || '';
        
        const result = await stockOpnameService.getAllScannedItems(page, limit, search);
        
        res.json({
            success: true,
            data: result.items,
            pagination: result.pagination
        });
    } catch (error) {
        console.error('Error getting scanned items:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get scanned items',
            error: error.message
        });
    }
};

// Get statistics for dashboard
const getStatistics = async (req, res) => {
    try {
        const stats = await stockOpnameService.getStatistics();
        
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

// Export all scanned items (no pagination) for Excel export
const exportAllScannedItems = async (req, res) => {
    try {
        const search = req.query.search || '';

        // Build search condition
        let searchCondition = '';
        let searchParams = [];

        if (search && search.trim() !== '') {
            searchCondition = `
                WHERE i.barcode LIKE ? 
                OR i.title LIKE ? 
                OR s.pic_name LIKE ?
            `;
            const searchPattern = `%${search.trim()}%`;
            searchParams = [searchPattern, searchPattern, searchPattern];
        }

        // Get ALL items without LIMIT
        const query = `
            SELECT 
                i.id,
                i.barcode,
                i.title,
                i.author,
                i.call_number as callNumber,
                i.year,
                i.type_procurement as typeProcurement,
                i.source,
                i.location,
                i.status_buku as statusBuku,
                i.has_warning as hasWarning,
                i.warning_types as warningTypes,
                i.forced_add as forcedAdd,
                i.scanned_at as scannedAt,
                s.id as sessionId,
                s.pic_name as picName,
                s.status as sessionStatus
            FROM stock_opname_items i
            JOIN stock_opname_sessions s ON i.session_id = s.id
            ${searchCondition}
            ORDER BY i.scanned_at DESC
        `;

        const { dbApp } = require('../config/database');
        const [items] = await dbApp.query(query, searchParams);

        // Parse JSON fields safely
        items.forEach(item => {
            try {
                item.warningTypes = typeof item.warningTypes === 'string'
                    ? JSON.parse(item.warningTypes || '[]')
                    : (item.warningTypes || []);
            } catch (error) {
                item.warningTypes = [];
            }
        });

        res.json({
            success: true,
            data: items,
            total: items.length
        });
    } catch (error) {
        console.error('Error exporting scanned items:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export scanned items',
            error: error.message
        });
    }
};

// Get location stats from scanned items
const getLocationStats = async (req, res) => {
    try {
        const stats = await stockOpnameService.getLocationStats();
        
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error getting location stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get location stats',
            error: error.message
        });
    }
};


module.exports = {
    createSession,
    checkDuplicate,
    addItemToSession,
    getSessionById,
    getAllSessions,
    updateSession,
    completeSession,
    deleteSession,
    getAllScannedItems,
    exportAllScannedItems,
    getStatistics,
    getLocationStats
};
