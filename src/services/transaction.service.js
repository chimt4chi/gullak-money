'use strict';
const { v4: uuidv4 } = require('uuid');
const db = require('../database/connection');

/**
 * List transactions with filtering, sorting, and pagination
 */
const getTransactions = async (userId, query) => {
  const {
    type,
    category_id,
    date_from,
    date_to,
    sort_by = 'date',
    sort_order = 'desc',
    page = 1,
    limit = 20,
  } = query;

  const allowedSortBy = ['date', 'amount', 'created_at'];
  const allowedSortOrder = ['asc', 'desc'];
  const safeSortBy = allowedSortBy.includes(sort_by) ? `t.${sort_by}` : 't.date';
  const safeSortOrder = allowedSortOrder.includes(sort_order.toLowerCase()) ? sort_order.toUpperCase() : 'DESC';

  const conditions = ['t.user_id = ?'];
  const params = [userId];

  if (type)        { conditions.push('t.type = ?');        params.push(type); }
  if (category_id) { conditions.push('t.category_id = ?'); params.push(category_id); }
  if (date_from)   { conditions.push('t.date >= ?');       params.push(date_from); }
  if (date_to)     { conditions.push('t.date <= ?');       params.push(date_to); }

  const where = `WHERE ${conditions.join(' AND ')}`;

  const [countRows] = await db.query(
    `SELECT COUNT(*) AS total FROM transactions t ${where}`,
    params
  );
  const total = countRows[0].total;

  const pageNum  = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const offset   = (pageNum - 1) * limitNum;

  const [rows] = await db.query(
    `SELECT
       t.id, t.user_id, t.category_id, c.name AS category_name, c.icon AS category_icon,
       t.type, t.amount, t.date, t.note, t.created_at, t.updated_at
     FROM transactions t
     JOIN categories c ON t.category_id = c.id
     ${where}
     ORDER BY ${safeSortBy} ${safeSortOrder}
     LIMIT ? OFFSET ?`,
    [...params, limitNum, offset]
  );

  return { rows, total, page: pageNum, limit: limitNum };
};

/**
 * Get a single transaction by ID — enforces user ownership
 */
const getTransaction = async (transactionId, userId) => {
  const [rows] = await db.query(
    `SELECT
       t.id, t.user_id, t.category_id, c.name AS category_name, c.icon AS category_icon,
       t.type, t.amount, t.date, t.note, t.created_at, t.updated_at
     FROM transactions t
     JOIN categories c ON t.category_id = c.id
     WHERE t.id = ? AND t.user_id = ?`,
    [transactionId, userId]
  );
  if (rows.length === 0) {
    const err = new Error('Transaction not found.');
    err.statusCode = 404;
    throw err;
  }
  return rows[0];
};

/**
 * Create a new transaction
 */
const createTransaction = async (userId, { category_id, type, amount, date, note }) => {
  // Verify category is accessible to this user
  const [catRows] = await db.query(
    'SELECT id FROM categories WHERE id = ? AND (is_default = 1 OR user_id = ?)',
    [category_id, userId]
  );
  if (catRows.length === 0) {
    const err = new Error('Category not found or not accessible.');
    err.statusCode = 404;
    throw err;
  }

  const id = uuidv4();
  await db.query(
    `INSERT INTO transactions (id, user_id, category_id, type, amount, date, note)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, userId, category_id, type, amount, date, note || null]
  );

  return getTransaction(id, userId);
};

/**
 * Update a transaction — user must own it
 */
const updateTransaction = async (transactionId, userId, updates) => {
  // Confirm ownership
  const [existing] = await db.query(
    'SELECT id FROM transactions WHERE id = ? AND user_id = ?',
    [transactionId, userId]
  );
  if (existing.length === 0) {
    const err = new Error('Transaction not found.');
    err.statusCode = 404;
    throw err;
  }

  // If category is being changed, validate accessibility
  if (updates.category_id) {
    const [catRows] = await db.query(
      'SELECT id FROM categories WHERE id = ? AND (is_default = 1 OR user_id = ?)',
      [updates.category_id, userId]
    );
    if (catRows.length === 0) {
      const err = new Error('Category not found or not accessible.');
      err.statusCode = 404;
      throw err;
    }
  }

  const allowedFields = ['category_id', 'type', 'amount', 'date', 'note'];
  const fields = [];
  const values = [];

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      fields.push(`${field} = ?`);
      values.push(updates[field]);
    }
  }

  if (fields.length === 0) {
    const err = new Error('No valid fields provided to update.');
    err.statusCode = 400;
    throw err;
  }

  values.push(transactionId);
  fields.push("updated_at = datetime('now')");
  await db.query(`UPDATE transactions SET ${fields.join(', ')} WHERE id = ?`, values);

  return getTransaction(transactionId, userId);
};

/**
 * Delete a transaction — user must own it
 */
const deleteTransaction = async (transactionId, userId) => {
  const [result] = await db.query(
    'DELETE FROM transactions WHERE id = ? AND user_id = ?',
    [transactionId, userId]
  );
  if (result.affectedRows === 0) {
    const err = new Error('Transaction not found.');
    err.statusCode = 404;
    throw err;
  }
};

module.exports = {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
};
