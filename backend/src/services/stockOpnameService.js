const { dbApp } = require('../config/database');

// Create new stock opname session
const createSession = async (sessionData) => {
    const { picName, rooms, classNumbers, statusBuku } = sessionData;
    
    const query = `
        INSERT INTO stock_opname_sessions 
        (pic_name, rooms, class_numbers, status_buku, status) 
        VALUES (?, ?, ?, ?, 'active')
    `;
    
    const [result] = await dbApp.query(query, [
        picName,
        JSON.stringify(rooms),
        JSON.stringify(classNumbers),
        JSON.stringify(statusBuku)
    ]);
    
    return {
        id: result.insertId,
        picName,
        rooms,
        classNumbers,
        statusBuku,
        status: 'active'
    };
};

// Check if barcode already exists in database
const checkDuplicate = async (barcode) => {
    const query = `
        SELECT 
            i.id,
            i.barcode,
            i.title,
            i.scanned_at as scannedAt,
            s.id as sessionId,
            s.pic_name as picName,
            s.status as sessionStatus,
            s.created_at as sessionCreatedAt
        FROM stock_opname_items i
        JOIN stock_opname_sessions s ON i.session_id = s.id
        WHERE i.barcode = ? 
        AND s.status = 'active'
        ORDER BY i.scanned_at DESC
        LIMIT 1
    `;
    
    const [results] = await dbApp.query(query, [barcode]);
    
    if (results.length > 0) {
        return {
            isDuplicate: true,
            data: results[0]
        };
    }
    
    return {
        isDuplicate: false,
        data: null
    };
};

// Add item to session
const addItemToSession = async (sessionId, itemData) => {
    const {
        barcode,
        title,
        author,
        callNumber,
        year,
        typeProcurement,
        source,
        location,
        statusBuku,
        hasWarning = false,
        warningTypes = [],
        forcedAdd = false
    } = itemData;
    
    const query = `
        INSERT INTO stock_opname_items 
        (session_id, barcode, title, author, call_number, year, 
         type_procurement, source, location, status_buku, 
         has_warning, warning_types, forced_add) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await dbApp.query(query, [
        sessionId,
        barcode,
        title,
        author,
        callNumber,
        year,
        typeProcurement,
        source,
        location,
        statusBuku,
        hasWarning,
        JSON.stringify(warningTypes),
        forcedAdd
    ]);
    
    return {
        id: result.insertId,
        sessionId,
        ...itemData
    };
};

// Get session by ID with items
const getSessionById = async (sessionId) => {
    // Get session
    const sessionQuery = `
        SELECT 
            id,
            pic_name as picName,
            rooms,
            class_numbers as classNumbers,
            status_buku as statusBuku,
            status,
            created_at as createdAt,
            updated_at as updatedAt
        FROM stock_opname_sessions 
        WHERE id = ?
    `;
    
    const [sessions] = await dbApp.query(sessionQuery, [sessionId]);
    
    if (sessions.length === 0) {
        return null;
    }
    
    const session = sessions[0];
    
    // Parse JSON fields safely
    try {
        session.rooms = typeof session.rooms === 'string' ? JSON.parse(session.rooms) : session.rooms;
        session.classNumbers = typeof session.classNumbers === 'string' ? JSON.parse(session.classNumbers) : session.classNumbers;
        session.statusBuku = typeof session.statusBuku === 'string' ? JSON.parse(session.statusBuku) : session.statusBuku;
    } catch (error) {
        console.error('Error parsing session JSON:', error);
        session.rooms = [];
        session.classNumbers = [];
        session.statusBuku = [];
    }
    
    // Get items
    const itemsQuery = `
        SELECT 
            id,
            session_id as sessionId,
            barcode,
            title,
            author,
            call_number as callNumber,
            year,
            type_procurement as typeProcurement,
            source,
            location,
            status_buku as statusBuku,
            has_warning as hasWarning,
            warning_types as warningTypes,
            forced_add as forcedAdd,
            scanned_at as scannedAt
        FROM stock_opname_items 
        WHERE session_id = ?
        ORDER BY scanned_at DESC
    `;
    
    const [items] = await dbApp.query(itemsQuery, [sessionId]);
    
    // Parse JSON fields in items safely
    items.forEach(item => {
        try {
            item.warningTypes = typeof item.warningTypes === 'string' ? JSON.parse(item.warningTypes || '[]') : (item.warningTypes || []);
        } catch (error) {
            console.error('Error parsing item warningTypes:', error);
            item.warningTypes = [];
        }
    });
    
    return {
        ...session,
        items,
        totalItems: items.length
    };
};

// Get all sessions with pagination
const getAllSessions = async (page = 1, limit = 10) => {
    const offset = (page - 1) * limit;
    
    // Get total count
    const countQuery = 'SELECT COUNT(*) as total FROM stock_opname_sessions';
    const [countResult] = await dbApp.query(countQuery);
    const total = countResult[0].total;
    
    // Get sessions
    const query = `
        SELECT 
            s.id,
            s.pic_name as picName,
            s.rooms,
            s.class_numbers as classNumbers,
            s.status_buku as statusBuku,
            s.status,
            s.created_at as createdAt,
            s.updated_at as updatedAt,
            COUNT(i.id) as totalItems
        FROM stock_opname_sessions s
        LEFT JOIN stock_opname_items i ON s.id = i.session_id
        GROUP BY s.id
        ORDER BY s.created_at DESC
        LIMIT ? OFFSET ?
    `;
    
    const [sessions] = await dbApp.query(query, [limit, offset]);
    
    // Parse JSON fields safely
    sessions.forEach(session => {
        try {
            // MySQL returns JSON as string, need to parse
            session.rooms = typeof session.rooms === 'string' ? JSON.parse(session.rooms) : session.rooms;
            session.classNumbers = typeof session.classNumbers === 'string' ? JSON.parse(session.classNumbers) : session.classNumbers;
            session.statusBuku = typeof session.statusBuku === 'string' ? JSON.parse(session.statusBuku) : session.statusBuku;
        } catch (error) {
            console.error('Error parsing JSON for session:', session.id, error);
            // Set defaults if parsing fails
            session.rooms = [];
            session.classNumbers = [];
            session.statusBuku = [];
        }
    });
    
    return {
        sessions,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
};

// Complete session
const completeSession = async (sessionId) => {
    const query = `
        UPDATE stock_opname_sessions 
        SET status = 'completed' 
        WHERE id = ?
    `;
    
    const [result] = await dbApp.query(query, [sessionId]);
    
    return result.affectedRows > 0;
};

// Update session profile
const updateSession = async (sessionId, sessionData) => {
    const { picName, rooms, classNumbers, statusBuku } = sessionData;
    
    const query = `
        UPDATE stock_opname_sessions 
        SET pic_name = ?, 
            rooms = ?, 
            class_numbers = ?, 
            status_buku = ?
        WHERE id = ?
    `;
    
    const [result] = await dbApp.query(query, [
        picName,
        JSON.stringify(rooms),
        JSON.stringify(classNumbers),
        JSON.stringify(statusBuku),
        sessionId
    ]);
    
    return result.affectedRows > 0;
};

// Delete session
const deleteSession = async (sessionId) => {
    const query = 'DELETE FROM stock_opname_sessions WHERE id = ?';
    const [result] = await dbApp.query(query, [sessionId]);
    
    return result.affectedRows > 0;
};

// Get all scanned items across all sessions with search and pagination
const getAllScannedItems = async (page = 1, limit = 50, search = '') => {
    const offset = (page - 1) * limit;
    
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
    
    // Get total count
    const countQuery = `
        SELECT COUNT(*) as total 
        FROM stock_opname_items i
        JOIN stock_opname_sessions s ON i.session_id = s.id
        ${searchCondition}
    `;
    const [countResult] = await dbApp.query(countQuery, searchParams);
    const total = countResult[0].total;
    
    // Get items with session info
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
        LIMIT ? OFFSET ?
    `;
    
    const [items] = await dbApp.query(query, [...searchParams, limit, offset]);
    
    // Parse JSON fields safely
    items.forEach(item => {
        try {
            item.warningTypes = typeof item.warningTypes === 'string' 
                ? JSON.parse(item.warningTypes || '[]') 
                : (item.warningTypes || []);
        } catch (error) {
            console.error('Error parsing item warningTypes:', error);
            item.warningTypes = [];
        }
    });
    
    return {
        items,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
};

// Get statistics for dashboard
const getStatistics = async () => {
    // Total scanned items
    const totalItemsQuery = 'SELECT COUNT(*) as total FROM stock_opname_items';
    const [totalItemsResult] = await dbApp.query(totalItemsQuery);
    const totalItems = totalItemsResult[0].total;
    
    // Items scanned today
    const todayQuery = `
        SELECT COUNT(*) as total 
        FROM stock_opname_items 
        WHERE DATE(scanned_at) = CURDATE()
    `;
    const [todayResult] = await dbApp.query(todayQuery);
    const itemsToday = todayResult[0].total;
    
    // Active sessions
    const activeSessionsQuery = `
        SELECT COUNT(*) as total 
        FROM stock_opname_sessions 
        WHERE status = 'active'
    `;
    const [activeSessionsResult] = await dbApp.query(activeSessionsQuery);
    const activeSessions = activeSessionsResult[0].total;
    
    // Items with warnings
    const warningsQuery = `
        SELECT COUNT(*) as total 
        FROM stock_opname_items 
        WHERE has_warning = 1
    `;
    const [warningsResult] = await dbApp.query(warningsQuery);
    const itemsWithWarnings = warningsResult[0].total;
    
    return {
        totalItems,
        itemsToday,
        activeSessions,
        itemsWithWarnings
    };
};

module.exports = {
    createSession,
    checkDuplicate,
    addItemToSession,
    getSessionById,
    getAllSessions,
    completeSession,
    updateSession,
    deleteSession,
    getAllScannedItems,
    getStatistics
};
