const express = require('express');
const router = express.Router();
const computerRentalController = require('../controllers/computerRentalController');

router.get('/', computerRentalController.getRentals);
router.get('/active', computerRentalController.getActiveRentals);
router.post('/start', computerRentalController.createRental);
router.post('/stop/:id', computerRentalController.completeRental);

module.exports = router;
