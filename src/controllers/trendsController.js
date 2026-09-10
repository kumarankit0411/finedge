const transactionService = require('../services/transactionService');

const getMonthlyTrends = async (req, res, next) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }
    const months = await transactionService.getMonthlyTrends(userId);
    res.status(200).json({ monthly: months });
  } catch (error) {
    next(error);
  }
};

module.exports = { getMonthlyTrends };