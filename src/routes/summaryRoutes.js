const express = require('express');
const router = express.Router();
const summaryController = require('../controllers/summaryController');
const authenticate = require('../middleware/auth');

router.get('/', authenticate, summaryController.getSummary);

module.exports = router;