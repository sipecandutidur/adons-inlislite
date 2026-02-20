const express = require('express');
const router = express.Router();
const brokenBookController = require('../controllers/brokenBookController');

// Report broken book
router.post('/', brokenBookController.reportBrokenBook);

// Get all broken books
router.get('/', brokenBookController.getAllBrokenBooks);

// Get statistics
router.get('/statistics', brokenBookController.getStatistics);

// Get history by barcode
router.get('/history/:barcode', brokenBookController.getHistory);

// Check duplicate
router.get('/check-duplicate/:barcode', brokenBookController.checkDuplicate);

// Get broken book by ID
router.get('/:id', brokenBookController.getBrokenBookById);

// Update action
router.patch('/:id/action', brokenBookController.updateAction);

module.exports = router;
