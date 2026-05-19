'use strict';
const bcrypt = require('bcryptjs');
const db = require('../database/connection');

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;

/**
 * Get a user's public profile by ID
 */
const getProfile = async (userId) => {
  const [rows] = await db.query(
    'SELECT id, name, email, created_at, updated_at FROM users WHERE id = ?',
    [userId]
  );
  if (rows.length === 0) {
    const err = new Error('User not found.');
    err.statusCode = 404;
    throw err;
  }
  return rows[0];
};

/**
 * Update profile fields (name and/or email)
 */
const updateProfile = async (userId, { name, email }) => {
  // Check email uniqueness if changing email
  if (email) {
    const [existing] = await db.query(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [email, userId]
    );
    if (existing.length > 0) {
      const err = new Error('This email is already in use by another account.');
      err.statusCode = 409;
      throw err;
    }
  }

  const fields = [];
  const values = [];
  if (name)  { fields.push('name = ?');  values.push(name); }
  if (email) { fields.push('email = ?'); values.push(email); }

  if (fields.length === 0) {
    const err = new Error('No fields provided to update.');
    err.statusCode = 400;
    throw err;
  }

  values.push(userId);
  fields.push("updated_at = datetime('now')");
  await db.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);

  return getProfile(userId);
};

/**
 * Change password — requires current password verification
 */
const changePassword = async (userId, { currentPassword, newPassword }) => {
  const [rows] = await db.query('SELECT password FROM users WHERE id = ?', [userId]);
  if (rows.length === 0) {
    const err = new Error('User not found.');
    err.statusCode = 404;
    throw err;
  }

  const isMatch = await bcrypt.compare(currentPassword, rows[0].password);
  if (!isMatch) {
    const err = new Error('Current password is incorrect.');
    err.statusCode = 400;
    throw err;
  }

  const hashed = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await db.query("UPDATE users SET password = ?, updated_at = datetime('now') WHERE id = ?", [hashed, userId]);
};

module.exports = { getProfile, updateProfile, changePassword };
