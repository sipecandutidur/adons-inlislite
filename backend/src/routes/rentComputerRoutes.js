const express = require('express');
const router = express.Router();
const rentComputerController = require('../controllers/rentComputerController');

router.post('/', rentComputerController.createRental);
router.get('/active', rentComputerController.getActiveRentals);
router.get('/history', rentComputerController.getRentalHistory);
router.put('/:id/complete', rentComputerController.completeRental);
router.put('/:id/extend', rentComputerController.extendRental);

module.exports = router;
