'use strict';
const { validationResult } = require('express-validator');
const { validationError } = require('../utils/response');

/**
 * Middleware: runs express-validator result check and returns 400 on failure.
 * Place after your validator chain in route definitions.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map((e) => ({
      field: e.path || e.param,
      message: e.msg,
    }));
    return validationError(res, formatted);
  }
  next();
};

module.exports = { validate };
