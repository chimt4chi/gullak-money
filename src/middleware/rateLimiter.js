'use strict';
const rateLimit = require('express-rate-limit');
const { error } = require('../utils/response');

const makeHandler = (max, windowMs, message) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => error(res, message, 429),
  });

/** General API rate limit */
const generalLimiter = makeHandler(
  parseInt(process.env.RATE_LIMIT_MAX) || 100,
  parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  'Too many requests, please try again later.'
);

/** Stricter limit for auth endpoints to prevent brute force */
const authLimiter = makeHandler(
  parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 10,
  parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  'Too many authentication attempts. Please wait before trying again.'
);

module.exports = { generalLimiter, authLimiter };
