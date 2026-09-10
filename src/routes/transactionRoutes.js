const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { validateTransaction } = require('../middleware/validator');
const authenticate = require('../middleware/auth');

router.post('/', authenticate, validateTransaction, transactionController.createTransaction);
router.get('/', authenticate, transactionController.getTransactions);
router.get('/:id', authenticate, transactionController.getTransactionById);
router.patch('/:id', authenticate, transactionController.updateTransaction);
router.delete('/:id', authenticate, transactionController.deleteTransaction);


module.exports = router;