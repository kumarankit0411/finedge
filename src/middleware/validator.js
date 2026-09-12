const { ValidationError } = require('../errors/apiError');

const validateTransaction = (req, res, next) => {
    const { type, category, description, amount, date } = req.body;
  
    if (!type || amount == null || !date) {
        return next(new ValidationError('All fields are required'));
    }
  
    if (!['income', 'expense'].includes(type)) {
        return next(new ValidationError('Type must be income or expense'));
    }
  
    if (typeof amount !== 'number' || amount < 0) {
        return next(new ValidationError('Amount must be a positive number'));
    }
  
    next();
};
  
module.exports = { validateTransaction };