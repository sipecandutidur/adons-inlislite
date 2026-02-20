const { dbInlislite } = require('../config/database');

class CollectionsService {
    async getCollections(page = 1, limit = 12, search = '') {
        try {
            const offset = (page - 1) * limit;
            const COVER_BASE_URL = 'http://192.168.35.8:8123/inlislite3/uploaded_files/sampul_koleksi/original/Monograf/';
            
            // Build base query specifically for Grouped Catalog Display
            let query = `
                SELECT 
                    c.Catalog_id,
                    MAX(c2.Title) as Title,
                    MAX(c2.Author) as Author,
                    MAX(c2.PublishYear) as PublishYear,
                    MAX(c2.Publisher) as Publisher,
                    MAX(c2.CoverURL) as CoverURL,
                    MAX(c.CallNumber) as CallNumber,
                    COUNT(c.ID) as TotalItems,
                    SUM(CASE WHEN c5.Name LIKE '%Tersedia%' OR c5.Name LIKE '%Available%' THEN 1 ELSE 0 END) as AvailableItems
                FROM inlislite_v31_depok.collections c 
                INNER JOIN inlislite_v31_depok.catalogs c2 ON c.Catalog_id=c2.ID 
                INNER JOIN inlislite_v31_depok.collectionstatus c5 ON c.Status_id=c5.ID
            `;

            let countQuery = `
                SELECT COUNT(DISTINCT c.Catalog_id) as total 
                FROM inlislite_v31_depok.collections c 
                INNER JOIN inlislite_v31_depok.catalogs c2 ON c.Catalog_id=c2.ID 
            `;

            // Add search condition if provided
            const params = [];
            if (search) {
                const searchClause = `
                    WHERE (
                        c2.Title LIKE ? OR 
                        c2.Author LIKE ? OR 
                        c2.ISBN LIKE ? OR 
                        c2.Publisher LIKE ? OR
                        c.NomorBarcode LIKE ?
                    )
                `;
                query += searchClause;
                countQuery += searchClause;
                const searchTerm = `%${search}%`;
                params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
            } else {
                query += ` WHERE 1=1 `;
                countQuery += ` WHERE 1=1 `;
            }

            // Grouping, Sorting and Pagination
            query += ` GROUP BY c.Catalog_id ORDER BY c.Catalog_id DESC LIMIT ? OFFSET ?`;
            params.push(parseInt(limit), parseInt(offset));

            // Execute Count Query
            let countParams = [];
            if (search) {
                const searchTerm = `%${search}%`;
                countParams = [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm];
            }
            const [countResult] = await dbInlislite.query(countQuery, countParams);
            const total = countResult[0].total;

            // Execute Data Query
            const [rows] = await dbInlislite.query(query, params);

            // Process rows to add full cover URL
            const processedRows = rows.map(row => ({
                ...row,
                CoverURL: row.CoverURL ? `${COVER_BASE_URL}${row.CoverURL}` : null
            }));

            return {
                success: true,
                data: processedRows,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            throw new Error(`Failed to fetch collections: ${error.message}`);
        }
    }

    async getItemsByCatalogId(catalogId) {
        try {
            // Detailed query for the Modal View
            // Fields: barcode, Nomor Pannggil, Judul, Pengarang, Edisi, Penerbit, Deskripsi Fisik, ISBN, Location, Status 
            const query = `
                SELECT 
                    c.NomorBarcode, 
                    c.CallNumber, 
                    c2.Title, 
                    c2.Author, 
                    c2.Edition, 
                    c2.Publisher, 
                    c2.PhysicalDescription, 
                    c2.ISBN, 
                    l.Name as LocationName, 
                    c3.Name as RuleName,
                    c5.Name as StatusName,
                    c4.Name as SourceName,
                    p.Name as PartnerName
                FROM inlislite_v31_depok.collections c 
                INNER JOIN inlislite_v31_depok.catalogs c2 ON c.Catalog_id=c2.ID 
                INNER JOIN inlislite_v31_depok.locations l ON c.Location_id=l.ID 
                INNER JOIN inlislite_v31_depok.collectionrules c3 ON c.Rule_id=c3.ID 
                INNER JOIN inlislite_v31_depok.collectionstatus c5 ON c.Status_id=c5.ID
                INNER JOIN inlislite_v31_depok.collectionsources c4 ON c.Source_id=c4.ID 
                INNER JOIN inlislite_v31_depok.partners p ON c.Partner_id=p.ID
                WHERE c.Catalog_id = ?
            `;
            
            const [rows] = await dbInlislite.query(query, [catalogId]);

            return rows;
        } catch (error) {
            throw new Error(`Failed to fetch collection items: ${error.message}`);
        }
    }

    async getPopularCollections(limit = 6) {
        try {
            const COVER_BASE_URL = 'http://192.168.35.8:8123/inlislite3/uploaded_files/sampul_koleksi/original/Monograf/';
            
            const query = `
                SELECT 
                    c3.ID as Catalog_id,
                    MIN(c3.Title) as Title,
                    MIN(c3.Author) as Author,
                    MIN(c3.PublishYear) as PublishYear,
                    MIN(c3.Publisher) as Publisher,
                    MIN(c3.CoverURL) as CoverURL,
                    MAX(c2.CallNumber) as CallNumber,
                    COUNT(c.ID) as LoanCount
                FROM inlislite_v31_depok.collectionloanitems c
                INNER JOIN inlislite_v31_depok.collections c2 ON c.Collection_id=c2.ID
                INNER JOIN inlislite_v31_depok.catalogs c3 ON c2.Catalog_id=c3.ID
                GROUP BY c3.ID
                ORDER BY LoanCount DESC
                LIMIT ?
            `;

            const [rows] = await dbInlislite.query(query, [parseInt(limit)]);

            const processedRows = rows.map(row => ({
                ...row,
                CoverURL: row.CoverURL ? `${COVER_BASE_URL}${row.CoverURL}` : null
            }));

            return {
                success: true,
                data: processedRows
            };
        } catch (error) {
            throw new Error(`Failed to fetch popular collections: ${error.message}`);
        }
    }
}

module.exports = new CollectionsService();
