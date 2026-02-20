const express = require('express');
const router = express.Router();
const stockOpnameController = require('../controllers/stockOpnameController');

// Session routes
router.post('/sessions', stockOpnameController.createSession);
router.get('/sessions', stockOpnameController.getAllSessions);
router.get('/sessions/:sessionId', stockOpnameController.getSessionById);
router.patch('/sessions/:sessionId', stockOpnameController.updateSession);
router.patch('/sessions/:sessionId/complete', stockOpnameController.completeSession);
router.delete('/sessions/:sessionId', stockOpnameController.deleteSession);

// Duplicate check route
router.get('/check-duplicate/:barcode', stockOpnameController.checkDuplicate);

// Item routes
router.post('/sessions/:sessionId/items', stockOpnameController.addItemToSession);
router.get('/items', stockOpnameController.getAllScannedItems);

// Statistics route
router.get('/statistics', stockOpnameController.getStatistics);

module.exports = router;
