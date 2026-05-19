'use strict';
const analyticsService = require('../services/analytics.service');
const { success } = require('../utils/response');

const getSummary = async (req, res, next) => {
  try {
    const summary = await analyticsService.getSummary(req.user.id, req.query);
    return success(res, { summary }, 'Summary fetched successfully.');
  } catch (err) {
    next(err);
  }
};

const getCategoryBreakdown = async (req, res, next) => {
  try {
    const breakdown = await analyticsService.getCategoryBreakdown(req.user.id, req.query);
    return success(res, { breakdown }, 'Category breakdown fetched successfully.');
  } catch (err) {
    next(err);
  }
};

const getMonthlyTrend = async (req, res, next) => {
  try {
    const trend = await analyticsService.getMonthlyTrend(req.user.id, req.query);
    return success(res, { trend }, 'Monthly trend fetched successfully.');
  } catch (err) {
    next(err);
  }
};

module.exports = { getSummary, getCategoryBreakdown, getMonthlyTrend };
