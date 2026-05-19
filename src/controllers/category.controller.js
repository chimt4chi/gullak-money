'use strict';
const categoryService = require('../services/category.service');
const { success, created } = require('../utils/response');

const getCategories = async (req, res, next) => {
  try {
    const categories = await categoryService.getCategories(req.user.id);
    return success(res, { categories }, 'Categories fetched successfully.');
  } catch (err) {
    next(err);
  }
};

const getCategory = async (req, res, next) => {
  try {
    const category = await categoryService.getCategory(req.params.id, req.user.id);
    return success(res, { category }, 'Category fetched successfully.');
  } catch (err) {
    next(err);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const category = await categoryService.createCategory(req.user.id, req.body);
    return created(res, { category }, 'Category created successfully.');
  } catch (err) {
    next(err);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const category = await categoryService.updateCategory(req.params.id, req.user.id, req.body);
    return success(res, { category }, 'Category updated successfully.');
  } catch (err) {
    next(err);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    await categoryService.deleteCategory(req.params.id, req.user.id);
    return success(res, null, 'Category deleted successfully.');
  } catch (err) {
    next(err);
  }
};

module.exports = { getCategories, getCategory, createCategory, updateCategory, deleteCategory };
