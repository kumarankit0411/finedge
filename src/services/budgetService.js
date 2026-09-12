const Budget = require('../models/budgetModel');
const { NotFoundError } = require('../errors/apiError');

const createBudget = async (data) => {
  const budget = new Budget(data);
  await budget.save();
  return budget;
};

const getBudgetsByUser = async (userId) => {
  return Budget.find({ userId }).sort({ month: 1 });
};

const getBudgetById = async (id) => {
  return Budget.findById(id);
};

const updateBudget = async (userId, id, updates) => {
  const { _id, userId: ownerId, ...rest } = updates;
  return Budget.findOneAndUpdate({ _id: id, userId }, rest, { returnDocument: 'after' });
};

module.exports = {
  createBudget,
  getBudgetsByUser,
  getBudgetById,
  updateBudget
};