const collectionsService = require('../services/collectionsService');

const getCollections = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const search = req.query.search || '';

        const result = await collectionsService.getCollections(page, limit, search);

        res.json(result);
    } catch (error) {
        console.error('Error fetching collections:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch collections',
            error: error.message
        });
    }
};

const getCollectionItems = async (req, res) => {
    try {
        const { catalogId } = req.params;
        const items = await collectionsService.getItemsByCatalogId(catalogId);

        res.json({
            success: true,
            data: items
        });
    } catch (error) {
        console.error('Error fetching collection items:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch collection items',
            error: error.message
        });
    }
};

const getPopularCollections = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 6;
        const result = await collectionsService.getPopularCollections(limit);
        res.json(result);
    } catch (error) {
        console.error('Error fetching popular collections:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch popular collections',
            error: error.message
        });
    }
};

module.exports = {
    getCollections,
    getCollectionItems,
    getPopularCollections
};
