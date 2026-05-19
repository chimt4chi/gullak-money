'use strict';
const jwt = require('jsonwebtoken');

const JWT_SECRET          = process.env.JWT_SECRET || 'change_this_secret';
const JWT_EXPIRES_IN      = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_SECRET  = process.env.JWT_REFRESH_SECRET || 'change_this_refresh_secret';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

/**
 * Generate a short-lived access token
 */
const generateAccessToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Generate a long-lived refresh token
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
};

/**
 * Verify an access token — returns decoded payload or throws
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

/**
 * Verify a refresh token — returns decoded payload or throws
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, JWT_REFRESH_SECRET);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  JWT_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN,
};
