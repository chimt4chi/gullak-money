'use strict';
const transactionService = require('../services/transaction.service');
const { success, created, paginated } = require('../utils/response');

const getTransactions = async (req, res, next) => {
  try {
    const { rows, total, page, limit } = await transactionService.getTransactions(req.user.id, req.query);
    return paginated(res, rows, total, page, limit, 'Transactions fetched successfully.');
  } catch (err) {
    next(err);
  }
};

const getTransaction = async (req, res, next) => {
  try {
    const transaction = await transactionService.getTransaction(req.params.id, req.user.id);
    return success(res, { transaction }, 'Transaction fetched successfully.');
  } catch (err) {
    next(err);
  }
};

const createTransaction = async (req, res, next) => {
  try {
    const transaction = await transactionService.createTransaction(req.user.id, req.body);
    return created(res, { transaction }, 'Transaction created successfully.');
  } catch (err) {
    next(err);
  }
};

const updateTransaction = async (req, res, next) => {
  try {
    const transaction = await transactionService.updateTransaction(req.params.id, req.user.id, req.body);
    return success(res, { transaction }, 'Transaction updated successfully.');
  } catch (err) {
    next(err);
  }
};

const deleteTransaction = async (req, res, next) => {
  try {
    await transactionService.deleteTransaction(req.params.id, req.user.id);
    return success(res, null, 'Transaction deleted successfully.');
  } catch (err) {
    next(err);
  }
};

module.exports = { getTransactions, getTransaction, createTransaction, updateTransaction, deleteTransaction };
