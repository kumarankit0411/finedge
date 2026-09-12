const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.RATE_LIMIT_MAX || 100,
  message: { message: 'Too many requests, please try again later' }
});

module.exports = limiter;