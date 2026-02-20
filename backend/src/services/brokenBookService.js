const { dbApp, dbInlislite } = require('../config/database');
const catalogService = require('./catalogService');

// Report broken book
const reportBrokenBook = async (bookData) => {
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
    } = bookData;
    
    try {
        // Check if book already exists in broken_books
        console.log(`[BrokenBook] Checking duplicate for barcode: ${barcode}`);
        const existingCheck = await checkDuplicate(barcode);
        
        if (existingCheck.isDuplicate) {
            console.log(`[BrokenBook] Duplicate found (ID: ${existingCheck.data.id}). Archiving to history...`);
            
            try {
                // Archive existing record to history
                await archiveToHistory(existingCheck.data.id);
                console.log(`[BrokenBook] Successfully archived record ID: ${existingCheck.data.id}`);
                
                // Delete from broken_books
                const [deleteResult] = await dbApp.query('DELETE FROM broken_books WHERE id = ?', [existingCheck.data.id]);
                console.log(`[BrokenBook] Deleted ${deleteResult.affectedRows} record(s) from broken_books`);
            } catch (archiveError) {
                console.error(`[BrokenBook] Error during archive/delete:`, archiveError);
                throw new Error(`Failed to archive existing report: ${archiveError.message}`);
            }
        } else {
            console.log(`[BrokenBook] No duplicate found. Creating new report...`);
        }
        
        // Insert new damage report
        const query = `
            INSERT INTO broken_books 
            (barcode, title, author, type_procurement, source, call_number, location, damage_type, 
             damage_description, reported_by, notes, action_taken) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
        `;

        // If typeProcurement or source is missing, try to fetch from catalog
        let finalTypeProcurement = typeProcurement;
        let finalSource = source;

        if (!finalTypeProcurement || !finalSource) {
            try {
                const catalog = await catalogService.getCatalogByBarcode(barcode);
                if (catalog.success) {
                    finalTypeProcurement = finalTypeProcurement || catalog.data.Type_Procurement;
                    finalSource = finalSource || catalog.data.Source;
                }
            } catch (err) {
                console.warn(`[BrokenBook] Failed to fetch catalog details for ${barcode}:`, err.message);
            }
        }
        
        const [result] = await dbApp.query(query, [
            barcode,
            title,
            author,
            finalTypeProcurement || null,
            finalSource || null,
            callNumber,
            location,
            damageType,
            damageDescription,
            reportedBy,
            notes || null
        ]);
        
        console.log(`[BrokenBook] Successfully inserted new report with ID: ${result.insertId}`);
        
        return {
            id: result.insertId,
            barcode,
            title,
            author,
            callNumber,
            location,
            damageType,
            damageDescription,
            reportedBy,
            notes,
            notes,
            typeProcurement: finalTypeProcurement,
            source: finalSource,
            actionTaken: 'pending'
        };
    } catch (error) {
        console.error(`[BrokenBook] Error in reportBrokenBook:`, error);
        throw error;
    }
};

// Check if barcode already reported
const checkDuplicate = async (barcode) => {
    const query = `
        SELECT 
            id,
            barcode,
            barcode,
            title,
            type_procurement as typeProcurement,
            source,
            damage_type as damageType,
            reported_by as reportedBy,
            action_taken as actionTaken,
            reported_at as reportedAt
        FROM broken_books
        WHERE barcode = ?
        ORDER BY reported_at DESC
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

// Get all broken books with search and filters
const getAllBrokenBooks = async (page = 1, limit = 50, search = '', damageTypeFilter = '', actionFilter = '') => {
    const offset = (page - 1) * limit;
    
    // Build search and filter conditions
    let conditions = [];
    let params = [];
    
    if (search && search.trim() !== '') {
        conditions.push('(barcode LIKE ? OR title LIKE ? OR reported_by LIKE ?)');
        const searchPattern = `%${search.trim()}%`;
        params.push(searchPattern, searchPattern, searchPattern);
    }
    
    if (damageTypeFilter && damageTypeFilter !== '') {
        conditions.push('damage_type = ?');
        params.push(damageTypeFilter);
    }
    
    if (actionFilter && actionFilter !== '') {
        conditions.push('action_taken = ?');
        params.push(actionFilter);
    }
    
    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    
    // Get total count
    const countQuery = `
        SELECT COUNT(*) as total 
        FROM broken_books
        ${whereClause}
    `;
    const [countResult] = await dbApp.query(countQuery, params);
    const total = countResult[0].total;
    
    // Get broken books
    const query = `
        SELECT 
            id,
            barcode,
            title,
            author,
            type_procurement as typeProcurement,
            source,
            call_number as callNumber,
            location,
            damage_type as damageType,
            damage_description as damageDescription,
            reported_by as reportedBy,
            action_taken as actionTaken,
            action_notes as actionNotes,
            notes,
            reported_at as reportedAt,
            updated_at as updatedAt
        FROM broken_books
        ${whereClause}
        ORDER BY reported_at DESC
        LIMIT ? OFFSET ?
    `;
    
    const [books] = await dbApp.query(query, [...params, limit, offset]);
    
    return {
        books,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
};

// Get broken book by ID
const getBrokenBookById = async (id) => {
    const query = `
        SELECT 
            id,
            barcode,
            title,
            author,
            type_procurement as typeProcurement,
            source,
            call_number as callNumber,
            location,
            damage_type as damageType,
            damage_description as damageDescription,
            reported_by as reportedBy,
            action_taken as actionTaken,
            action_notes as actionNotes,
            notes,
            reported_at as reportedAt,
            updated_at as updatedAt
        FROM broken_books
        WHERE id = ?
    `;
    
    const [results] = await dbApp.query(query, [id]);
    
    return results.length > 0 ? results[0] : null;
};

// Update action taken
const updateAction = async (id, actionData) => {
    const { actionTaken, actionNotes } = actionData;
    
    const query = `
        UPDATE broken_books 
        SET action_taken = ?, 
            action_notes = ?
        WHERE id = ?
    `;
    
    const [result] = await dbApp.query(query, [actionTaken, actionNotes || null, id]);
    
    return result.affectedRows > 0;
};

// Archive current broken book record to history
const archiveToHistory = async (id) => {
    try {
        console.log(`[Archive] Fetching record ID: ${id} for archiving...`);
        
        // Get current record
        const book = await getBrokenBookById(id);
        
        if (!book) {
            console.error(`[Archive] Book not found with ID: ${id}`);
            throw new Error('Book not found');
        }
        
        console.log(`[Archive] Found book: ${book.barcode} - ${book.title}`);
        
        // Insert into history with resolved_at timestamp
        const query = `
            INSERT INTO broken_books_history 
            (barcode, title, author, type_procurement, source, call_number, location, damage_type, 
             damage_description, reported_by, action_taken, action_notes, notes, 
             reported_at, resolved_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;
        
        const [result] = await dbApp.query(query, [
            book.barcode,
            book.title,
            book.author,
            book.typeProcurement,
            book.source,
            book.callNumber,
            book.location,
            book.damageType,
            book.damageDescription,
            book.reportedBy,
            book.actionTaken,
            book.actionNotes || null,
            book.notes || null,
            book.reportedAt
        ]);
        
        console.log(`[Archive] Successfully archived to history with ID: ${result.insertId}`);
        
        return true;
    } catch (error) {
        console.error(`[Archive] Error archiving record:`, error);
        throw error;
    }
};

// Get damage history for a barcode
const getHistory = async (barcode) => {
    const query = `
        SELECT 
            id,
            barcode,
            title,
            author,
            type_procurement as typeProcurement,
            source,
            call_number as callNumber,
            location,
            damage_type as damageType,
            damage_description as damageDescription,
            reported_by as reportedBy,
            action_taken as actionTaken,
            action_notes as actionNotes,
            notes,
            reported_at as reportedAt,
            resolved_at as resolvedAt,
            created_at as createdAt,
            updated_at as updatedAt
        FROM broken_books_history
        WHERE barcode = ?
        ORDER BY reported_at DESC
    `;
    
    const [results] = await dbApp.query(query, [barcode]);
    
    return results;
};

// Get history count for a barcode
const getHistoryCount = async (barcode) => {
    const query = 'SELECT COUNT(*) as count FROM broken_books_history WHERE barcode = ?';
    const [result] = await dbApp.query(query, [barcode]);
    return result[0].count;
};

// Get statistics
const getStatistics = async () => {
    // Total broken books
    const totalQuery = 'SELECT COUNT(*) as total FROM broken_books';
    const [totalResult] = await dbApp.query(totalQuery);
    const totalBooks = totalResult[0].total;
    
    // Pending
    const pendingQuery = `SELECT COUNT(*) as total FROM broken_books WHERE action_taken = 'pending'`;
    const [pendingResult] = await dbApp.query(pendingQuery);
    const pending = pendingResult[0].total;
    
    // Under repair
    const underRepairQuery = `SELECT COUNT(*) as total FROM broken_books WHERE action_taken = 'under_repair'`;
    const [underRepairResult] = await dbApp.query(underRepairQuery);
    const underRepair = underRepairResult[0].total;
    
    // Repaired
    const repairedQuery = `SELECT COUNT(*) as total FROM broken_books WHERE action_taken = 'repaired'`;
    const [repairedResult] = await dbApp.query(repairedQuery);
    const repaired = repairedResult[0].total;
    
    // Discarded
    const discardedQuery = `SELECT COUNT(*) as total FROM broken_books WHERE action_taken = 'discarded'`;
    const [discardedResult] = await dbApp.query(discardedQuery);
    const discarded = discardedResult[0].total;
    
    return {
        totalBooks,
        pending,
        underRepair,
        repaired,
        discarded
    };
};

module.exports = {
    reportBrokenBook,
    checkDuplicate,
    getAllBrokenBooks,
    getBrokenBookById,
    updateAction,
    getStatistics,
    archiveToHistory,
    getHistory,
    getHistoryCount
};
