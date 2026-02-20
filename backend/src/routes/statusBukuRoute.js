const express = require('express');
const router = express.Router();
const statusBukuController = require('../controllers/statusBukuController');

router.get('/', statusBukuController.getAllStatusBuku);

module.exports = router;