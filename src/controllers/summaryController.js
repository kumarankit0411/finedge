const transactionService = require('../services/transactionService');
const CacheService = require('../services/cacheService');
const { ValidationError } = require('../errors/apiError');

const cache = new CacheService(60 * 1000);

const getSummary = async (req, res, next) => {
    try {
      const cacheKey = `summary:${req.user.userId}`;
  
      const cached = cache.get(cacheKey);
      if (cached) {
        return res.status(200).json(cached);
      }
  
      const summary = await transactionService.getSummary(req.user.userId);
      cache.set(cacheKey, summary);
      res.status(200).json(summary);
    } catch (error) {
      next(error);
    }
};
  
module.exports = { getSummary };