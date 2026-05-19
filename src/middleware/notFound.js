'use strict';
const { error } = require('../utils/response');

const notFound = (req, res) => {
  error(res, `Route ${req.method} ${req.originalUrl} not found`, 404);
};

module.exports = notFound;
