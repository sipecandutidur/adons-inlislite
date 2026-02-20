const express = require('express');
const router = express.Router();
const catalogController = require('../controllers/catalogController');

// GET /api/catalogs - Get all catalogs with pagination
router.get('/', catalogController.getCatalogs);

// GET /api/catalogs/:id - Get catalog by ID
//router.get('/:id', catalogController.getCatalogById);

// GET /api/catalogs/:barcode - Get catalog by barcode
router.get('/:barcode', catalogController.getCatalogByBarcode);

module.exports = router;
