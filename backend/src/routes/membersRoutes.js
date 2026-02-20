const express = require('express');
const router = express.Router();
const membersController = require('../controllers/membersController');

router.get('/', membersController.getAllMembers);
router.get('/:noMember', membersController.getMemberById);

module.exports = router;