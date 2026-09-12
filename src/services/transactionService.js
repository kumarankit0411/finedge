const mongoose = require('mongoose');
const Transaction = require('../models/transactionModel');

const createTransaction = async (data) => {
  const transaction = new Transaction(data);
  await transaction.save();
  return transaction;
};

const getTransactionsByUser = async (userId, filters = {}) => {
    const query = { userId };
  
    if (filters.category) {
      query.category = filters.category;
    }
  
    if (filters.startDate || filters.endDate) {
      query.date = {};
      if (filters.startDate) query.date.$gte = new Date(filters.startDate);
      if (filters.endDate) query.date.$lte = new Date(filters.endDate);
    }
  
    return Transaction.find(query).sort({ date: -1 });
};

const getTransactionById = async (userId, id) => {
  return Transaction.findOne({ _id: id, userId });
};

const updateTransaction = async (userId, id, updates) => {
  const { _id, userId: ownerId, ...rest } = updates;
  return Transaction.findOneAndUpdate({ _id: id, userId }, rest, { returnDocument: 'after' });
};

const deleteTransaction = async (userId, id) => {
  return Transaction.findOneAndDelete({ _id: id, userId });
};

const getSummary = async (userId) => {
    const transactions = await Transaction.find({ userId });
  
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  
    const balance = totalIncome - totalExpenses;
  
    return { totalIncome, totalExpenses, balance };
};

const getMonthlyTrends = async (userId) => {
    return Transaction.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: { year: { $year: '$date' }, month: { $month: '$date' } },
          income: { $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] } },
          expenses: { $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] } }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
};

module.exports = {
  createTransaction,
  getTransactionsByUser,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  getSummary,
  getMonthlyTrends
};