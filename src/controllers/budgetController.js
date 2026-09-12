const budgetService = require('../services/budgetService');
const { ValidationError, NotFoundError } = require('../errors/apiError');

const createBudget = async (req, res, next) => {
  try {
    const { month, monthlyGoal, savingsTarget } = req.body;
    if ( !req.user.userId || !month || monthlyGoal == null || savingsTarget == null ) {
      throw new ValidationError('All fields are required');
    }
    if ( monthlyGoal < 0 || savingsTarget < 0 ) {
      throw new ValidationError('Goal and savings must be non-negative');
    }
    const budget = await budgetService.createBudget({
      userId: req.user.userId, month, monthlyGoal, savingsTarget
    });
    res.status(201).json({ budget });
  } catch (error) {
    next(error);
  }
};

const getBudgets = async (req, res, next) => {
  try {
    const { userId } = req.query;
    const budgets = await budgetService.getBudgetsByUser(req.user.userId);
    res.status(200).json({ budgets });
  } catch (error) {
    next(error);
  }
};

const updateBudget = async (req, res, next) => {
  try {
    const budget = await budgetService.updateBudget(req.user.userId, req.params.id, req.body);
    if (!budget) {
      throw new NotFoundError('Budget not found');
    }
    res.status(200).json({ budget });
  } catch (error) {
    next(error);
  }
};

module.exports = { createBudget, getBudgets, updateBudget };