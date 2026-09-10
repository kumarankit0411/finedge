const express = require('express');
const router = express.Router();
const trendsController = require('../controllers/trendsController');
const authenticate = require('../middleware/auth');

router.get('/', authenticate, trendsController.getMonthlyTrends);

module.exports = router;