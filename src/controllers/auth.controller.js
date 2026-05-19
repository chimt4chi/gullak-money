'use strict';
const authService = require('../services/auth.service');
const { success, created, error } = require('../utils/response');

const register = async (req, res, next) => {
  try {
    const { user, tokens } = await authService.register(req.body);
    return created(res, { user, tokens }, 'Account created successfully.');
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { user, tokens } = await authService.login(req.body);
    return success(res, { user, tokens }, 'Login successful.');
  } catch (err) {
    next(err);
  }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return error(res, 'Refresh token is required.', 400);
    const { tokens } = await authService.refreshToken(refreshToken);
    return success(res, { tokens }, 'Token refreshed successfully.');
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    await authService.logout(req.user.id, refreshToken);
    return success(res, null, 'Logged out successfully.');
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, refresh, logout };
