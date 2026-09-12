const errorHandler = (err, req, res, next) => {
    if (err.name === 'ValidationError' || err.name === 'CastError') {
      return res.status(400).json({ message: err.message });
    }
    if (err.statusCode >= 500 || !err.statusCode) {
      console.error(err.stack);
    }
    res.status(err.statusCode || 500).json({ message: err.message || 'Something went wrong' });
};

module.exports = errorHandler;