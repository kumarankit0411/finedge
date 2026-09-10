const dotenv = require('dotenv');

dotenv.config()

const express = require('express');
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const userRoutes = require('./routes/userRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const summaryRoutes = require('./routes/summaryRoutes');
const trendsRoutes = require('./routes/trendsRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const rateLimiter = require('./middleware/rateLimiter');

const app = express()

app.use(express.json());

const cors = require('cors');

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : '*';

app.use(cors({
  origin: allowedOrigins === '*' ? '*' : (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
}));

app.use(logger);
app.use(rateLimiter);

app.get('/health', (req, res) => {
    res.status(200).json({status: 'ok'});
});

app.use('/users', userRoutes);
app.use('/transactions', transactionRoutes);
app.use('/summary', summaryRoutes);
app.use('/summary/trends', trendsRoutes);
app.use('/budgets', budgetRoutes);

app.use(errorHandler);

module.exports = app;
