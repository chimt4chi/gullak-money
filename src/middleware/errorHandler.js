'use strict';
const logger = require('../utils/logger');

/**
 * Global error handler — never exposes stack traces to the client.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  logger.error(`${req.method} ${req.originalUrl} — ${err.message}`, { stack: err.stack });

  // Handle MySQL-specific errors
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ success: false, message: 'A record with this value already exists.' });
  }
  if (err.code === 'ER_ROW_IS_REFERENCED_2') {
    return res.status(409).json({ success: false, message: 'Cannot delete: this record is referenced by other data.' });
  }

  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? 'An internal server error occurred.' : err.message,
  });
};

module.exports = errorHandler;
