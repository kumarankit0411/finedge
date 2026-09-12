const express = require('express');
const router = express.Router();
const budgetController = require('../controllers/budgetController');
const authenticate = require('../middleware/auth');

router.post('/', authenticate, budgetController.createBudget);
router.get('/', authenticate, budgetController.getBudgets);
router.patch('/:id', authenticate, budgetController.updateBudget);

module.exports = router;