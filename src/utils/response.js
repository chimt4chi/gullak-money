'use strict';

/**
 * Standard success response helper
 */
const success = (res, data = null, message = 'Success', statusCode = 200) => {
  const payload = { success: true, message };
  if (data !== null) payload.data = data;
  return res.status(statusCode).json(payload);
};

/**
 * Standard created response helper
 */
const created = (res, data = null, message = 'Created successfully') => {
  return success(res, data, message, 201);
};

/**
 * Standard error response helper
 */
const error = (res, message = 'An error occurred', statusCode = 500, errors = null) => {
  const payload = { success: false, message };
  if (errors) payload.errors = errors;
  return res.status(statusCode).json(payload);
};

/**
 * Validation error response helper
 */
const validationError = (res, errors) => {
  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors,
  });
};

/**
 * Paginated response helper
 */
const paginated = (res, rows, total, page, limit, message = 'Success') => {
  return res.status(200).json({
    success: true,
    message,
    data: rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
};

module.exports = { success, created, error, validationError, paginated };
