const { logger } = require('../utils/logger');

class ApiError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

const notFoundHandler = (req, res) => {
  res.status(404).json({ message: 'Route not found' });
};

// Centralized error handler
const errorHandler = (err, req, res, _next) => {
  const status = err instanceof ApiError ? err.statusCode : 500;
  const body = {
    message: err.message || 'Internal server error',
    ...(err instanceof ApiError && err.details ? { details: err.details } : {})
  };

  logger.error({ err, path: req.path }, 'Request failed');
  res.status(status).json(body);
};

module.exports = { ApiError, notFoundHandler, errorHandler };
