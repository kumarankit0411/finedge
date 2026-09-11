const transactionService = require('../services/transactionService');

const getMonthlyTrends = async (req, res, next) => {
  try {
    const months = await transactionService.getMonthlyTrends(req.user.userId);
    res.status(200).json({ monthly: months });
  } catch (error) {
    next(error);
  }
};

module.exports = { getMonthlyTrends };