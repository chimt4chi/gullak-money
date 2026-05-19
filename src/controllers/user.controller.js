'use strict';
const userService = require('../services/user.service');
const { success } = require('../utils/response');

const getProfile = async (req, res, next) => {
  try {
    const user = await userService.getProfile(req.user.id);
    return success(res, { user }, 'Profile fetched successfully.');
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const user = await userService.updateProfile(req.user.id, req.body);
    return success(res, { user }, 'Profile updated successfully.');
  } catch (err) {
    next(err);
  }
};

const changePassword = async (req, res, next) => {
  try {
    await userService.changePassword(req.user.id, req.body);
    return success(res, null, 'Password changed successfully.');
  } catch (err) {
    next(err);
  }
};

module.exports = { getProfile, updateProfile, changePassword };
