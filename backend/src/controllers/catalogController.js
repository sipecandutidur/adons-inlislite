const catalogService = require('../services/catalogService');

class CatalogController {
    async getCatalogs(req, res) {
        try {
            const { page = 1, limit = 10 } = req.query;
            const result = await catalogService.getAllCatalogs(page, limit);
            
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async getCatalogById(req, res) {
        try {
            const { id } = req.params;
            const result = await catalogService.getCatalogById(id);
            
            if (!result.success) {
                return res.status(404).json(result);
            }

            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async getCatalogByBarcode(req, res) {
        try {
            const { barcode } = req.params;
            const result = await catalogService.getCatalogByBarcode(barcode);
            
            if (!result.success) {
                return res.status(404).json(result);
            }

            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = new CatalogController();
