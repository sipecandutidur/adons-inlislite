const { dbInlislite } = require('../config/database');

class CatalogService {
    async getAllCatalogs(page = 1, limit = 10) {
        try {
            const offset = (page - 1) * limit;
            
            // Get total count
            const [countResult] = await dbInlislite.query(
                'SELECT COUNT(*) as total FROM catalogs'
            );
            const total = countResult[0].total;

            // Get paginated data
            const [rows] = await dbInlislite.query(
                'SELECT collections.NomorBarcode AS Barcode, collections.CallNumber AS Call_Number, catalogs.Title AS Title, catalogs.Author AS Author, catalogs.PublishYear AS YEAR, collectionsources.Name AS Type_Procurement, partners.Name AS Source, locations.Name, collectionstatus.Name AS STATUS FROM collections INNER JOIN catalogs  ON collections.Catalog_id=catalogs.ID INNER JOIN collectionstatus ON collections.Status_id=collectionstatus.ID INNER JOIN partners ON collections.Partner_id=partners.ID INNER JOIN collectionsources ON collections.Source_id=collectionsources.ID INNER JOIN locations ON collections.Location_id=locations.ID  LIMIT ? OFFSET ?',
                [parseInt(limit), parseInt(offset)]
            );

            return {
                success: true,
                data: rows,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            throw new Error(`Failed to fetch catalogs: ${error.message}`);
        }
    }

    async getCatalogById(id) {
        try {
            const [rows] = await dbInlislite.query(
                'SELECT * FROM catalogs WHERE id = ?',
                [id]
            );

            if (rows.length === 0) {
                return {
                    success: false,
                    message: 'Catalog not found'
                };
            }

            return {
                success: true,
                data: rows[0]
            };
        } catch (error) {
            throw new Error(`Failed to fetch catalog: ${error.message}`);
        }
    }

    async getCatalogByBarcode(barcode) {
        try {
            const [rows] = await dbInlislite.query(
                'SELECT collections.NomorBarcode AS Barcode, collections.CallNumber AS Call_Number, catalogs.Title AS Title, catalogs.Author AS Author, catalogs.PublishYear AS YEAR, collectionsources.Name AS Type_Procurement, partners.Name AS Source, locations.Name, collectionstatus.Name AS STATUS FROM collections INNER JOIN catalogs  ON collections.Catalog_id=catalogs.ID INNER JOIN collectionstatus ON collections.Status_id=collectionstatus.ID INNER JOIN partners ON collections.Partner_id=partners.ID INNER JOIN collectionsources ON collections.Source_id=collectionsources.ID INNER JOIN locations ON collections.Location_id=locations.ID WHERE collections.NomorBarcode = ?',
                [barcode]
            );

            if (rows.length === 0) {
                return {
                    success: false,
                    message: 'Catalog not found'
                };
            }

            return {
                success: true,
                data: rows[0]
            };
        } catch (error) {
            throw new Error(`Failed to fetch catalog: ${error.message}`);
        }
    }
}

module.exports = new CatalogService();
