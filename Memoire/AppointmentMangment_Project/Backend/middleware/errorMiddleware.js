// middleware/errorMiddleware.js
const logger = require('../utils/logger');

const errorMiddleware = (err, req, res, next) => {
  logger.error(err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Server Error',
  });
};

module.exports = errorMiddleware;