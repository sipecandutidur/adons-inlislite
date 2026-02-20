const express = require('express');
const router = express.Router();
const collectionsController = require('../controllers/collectionsController');

router.get('/', collectionsController.getCollections);
router.get('/popular', collectionsController.getPopularCollections);
router.get('/:catalogId/items', collectionsController.getCollectionItems);

module.exports = router;
