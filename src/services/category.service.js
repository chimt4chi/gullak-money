'use strict';
const { v4: uuidv4 } = require('uuid');
const db = require('../database/connection');

/**
 * Get all categories accessible to a user (defaults + their own custom ones)
 */
const getCategories = async (userId) => {
  const [rows] = await db.query(
    `SELECT id, name, icon, color, is_default, user_id, created_at, updated_at
     FROM categories
     WHERE is_default = 1 OR user_id = ?
     ORDER BY is_default DESC, name ASC`,
    [userId]
  );
  return rows;
};

/**
 * Get a single category — must belong to user or be a default
 */
const getCategory = async (categoryId, userId) => {
  const [rows] = await db.query(
    `SELECT id, name, icon, color, is_default, user_id, created_at, updated_at
     FROM categories
     WHERE id = ? AND (is_default = 1 OR user_id = ?)`,
    [categoryId, userId]
  );
  if (rows.length === 0) {
    const err = new Error('Category not found.');
    err.statusCode = 404;
    throw err;
  }
  return rows[0];
};

/**
 * Create a custom category for the user
 */
const createCategory = async (userId, { name, icon, color }) => {
  // Check for duplicate name within this user's scope
  const [existing] = await db.query(
    `SELECT id FROM categories WHERE (user_id = ? OR is_default = 1) AND LOWER(name) = LOWER(?)`,
    [userId, name]
  );
  if (existing.length > 0) {
    const err = new Error('A category with this name already exists.');
    err.statusCode = 409;
    throw err;
  }

  const id = uuidv4();
  await db.query(
    `INSERT INTO categories (id, name, icon, color, is_default, user_id) VALUES (?, ?, ?, ?, 0, ?)`,
    [id, name, icon || null, color || null, userId]
  );

  return getCategory(id, userId);
};

/**
 * Update a custom category — user must own it and it must not be a default
 */
const updateCategory = async (categoryId, userId, { name, icon, color }) => {
  const [rows] = await db.query(
    'SELECT id, is_default, user_id FROM categories WHERE id = ?',
    [categoryId]
  );
  if (rows.length === 0) {
    const err = new Error('Category not found.');
    err.statusCode = 404;
    throw err;
  }

  const cat = rows[0];
  if (cat.is_default) {
    const err = new Error('Default categories cannot be modified.');
    err.statusCode = 403;
    throw err;
  }
  if (cat.user_id !== userId) {
    const err = new Error('You do not have permission to modify this category.');
    err.statusCode = 403;
    throw err;
  }

  const fields = [];
  const values = [];
  if (name  !== undefined) { fields.push('name = ?');  values.push(name); }
  if (icon  !== undefined) { fields.push('icon = ?');  values.push(icon); }
  if (color !== undefined) { fields.push('color = ?'); values.push(color); }

  if (fields.length === 0) {
    const err = new Error('No fields provided to update.');
    err.statusCode = 400;
    throw err;
  }

  values.push(categoryId);
  fields.push("updated_at = datetime('now')");
  await db.query(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`, values);

  return getCategory(categoryId, userId);
};

/**
 * Delete a custom category — cannot delete defaults
 */
const deleteCategory = async (categoryId, userId) => {
  const [rows] = await db.query(
    'SELECT id, is_default, user_id FROM categories WHERE id = ?',
    [categoryId]
  );
  if (rows.length === 0) {
    const err = new Error('Category not found.');
    err.statusCode = 404;
    throw err;
  }

  const cat = rows[0];
  if (cat.is_default) {
    const err = new Error('Default categories cannot be deleted.');
    err.statusCode = 403;
    throw err;
  }
  if (cat.user_id !== userId) {
    const err = new Error('You do not have permission to delete this category.');
    err.statusCode = 403;
    throw err;
  }

  // Check if any transactions reference this category
  const [txRows] = await db.query(
    'SELECT COUNT(*) AS cnt FROM transactions WHERE category_id = ?',
    [categoryId]
  );
  if (txRows[0].cnt > 0) {
    const err = new Error('Cannot delete this category because it has associated transactions. Reassign or delete those transactions first.');
    err.statusCode = 409;
    throw err;
  }

  await db.query('DELETE FROM categories WHERE id = ?', [categoryId]);
};

module.exports = { getCategories, getCategory, createCategory, updateCategory, deleteCategory };
