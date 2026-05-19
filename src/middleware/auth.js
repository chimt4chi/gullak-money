'use strict';
const { verifyAccessToken } = require('../utils/jwt');
const { error } = require('../utils/response');

/**
 * Middleware: validates Bearer JWT token and attaches decoded user to req.user
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, 'Authorization token is required', 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded; // { id, email, name, iat, exp }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return error(res, 'Access token has expired. Please refresh your token.', 401);
    }
    return error(res, 'Invalid or malformed token', 401);
  }
};

module.exports = { authenticate };
