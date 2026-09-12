const transactionService = require('../services/transactionService');
const { ValidationError, NotFoundError } = require('../errors/apiError');
const { categorizeTransaction } = require('../services/categorizer');

const createTransaction = async (req, res, next) => {
    try {
      const { userId, type, category, description, amount, date } = req.body;
  
      const finalCategory = category || categorizeTransaction(description);
      const transaction = await transactionService.createTransaction({
        userId: req.user.userId, type, category: finalCategory, description, amount, date
      });
      res.status(201).json({ transaction });
    } catch (error) {
      next(error);
    }
};

const getTransactions = async (req, res, next) => {
    try {
      const { category, startDate, endDate } = req.query;
      const transactions = await transactionService.getTransactionsByUser(req.user.userId, {
        category,
        startDate,
        endDate
      });
      res.status(200).json({ transactions });
    } catch (error) {
      next(error);
    }
};

const getTransactionById = async (req, res, next) => {
    try {
      const transaction = await transactionService.getTransactionById(req.user.userId, req.params.id);
      if (!transaction) {
        throw new NotFoundError('Transaction not found');
      }
      res.status(200).json({ transaction });
    } catch (error) {
      next(error);
    }
};

const updateTransaction = async (req, res, next) => {
    try {
      const transaction = await transactionService.updateTransaction(req.user.userId, req.params.id, req.body);
      if (!transaction) {
        throw new NotFoundError('Transaction not found');
      }
      res.status(200).json({ transaction });
    } catch (error) {
      next(error);
    }
};

const deleteTransaction = async (req, res, next) => {
    try {
      const transaction = await transactionService.deleteTransaction(req.user.userId, req.params.id);
      if (!transaction) {
        throw new NotFoundError('Transaction not found');
      }
      res.status(200).json({ message: 'Transaction deleted' });
    } catch (error) {
      next(error);
    }
};
  
  
module.exports = {
    createTransaction,
    getTransactions,
    getTransactionById,
    updateTransaction,
    deleteTransaction
};
  
  