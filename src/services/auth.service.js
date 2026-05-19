'use strict';
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const db = require('../database/connection');
const { query: dbQuery, getConnection } = db;
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  JWT_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN,
} = require('../utils/jwt');

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;

/**
 * Register a new user
 */
const register = async ({ name, email, password }) => {
  // Check for existing email
  const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length > 0) {
    const err = new Error('An account with this email already exists.');
    err.statusCode = 409;
    throw err;
  }

  const id = uuidv4();
  const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

  await db.query(
    'INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)',
    [id, name, email, hashedPassword]
  );

  const [rows] = await db.query(
    'SELECT id, name, email, created_at, updated_at FROM users WHERE id = ?',
    [id]
  );
  const user = rows[0];
  const tokens = _issueTokens(user);
  await _saveRefreshToken(user.id, tokens.refreshToken);

  return { user, tokens };
};

/**
 * Login with email + password
 */
const login = async ({ email, password }) => {
  const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
  if (rows.length === 0) {
    const err = new Error('Invalid email or password.');
    err.statusCode = 401;
    throw err;
  }

  const user = rows[0];
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const err = new Error('Invalid email or password.');
    err.statusCode = 401;
    throw err;
  }

  const publicUser = { id: user.id, name: user.name, email: user.email, created_at: user.created_at, updated_at: user.updated_at };
  const tokens = _issueTokens(publicUser);
  await _saveRefreshToken(user.id, tokens.refreshToken);

  return { user: publicUser, tokens };
};

/**
 * Refresh access token using a valid refresh token
 */
const refreshToken = async (token) => {
  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    const err = new Error('Invalid or expired refresh token.');
    err.statusCode = 401;
    throw err;
  }

  // Confirm it's stored in DB (enables single-session invalidation)
  const [rows] = await db.query(
    `SELECT * FROM refresh_tokens WHERE token = ? AND user_id = ? AND expires_at > datetime('now')`,
    [token, decoded.id]
  );
  if (rows.length === 0) {
    const err = new Error('Refresh token is invalid or has been revoked.');
    err.statusCode = 401;
    throw err;
  }

  const [userRows] = await db.query(
    'SELECT id, name, email FROM users WHERE id = ?',
    [decoded.id]
  );
  if (userRows.length === 0) {
    const err = new Error('User not found.');
    err.statusCode = 404;
    throw err;
  }

  const user = userRows[0];
  const tokens = _issueTokens(user);

  // Rotate refresh token (revoke old, store new)
  await db.query('DELETE FROM refresh_tokens WHERE token = ?', [token]);
  await _saveRefreshToken(user.id, tokens.refreshToken);

  return { tokens };
};

/**
 * Logout — revoke refresh token from DB
 */
const logout = async (userId, refreshTokenValue) => {
  if (refreshTokenValue) {
    await db.query(
      'DELETE FROM refresh_tokens WHERE user_id = ? AND token = ?',
      [userId, refreshTokenValue]
    );
  } else {
    // Revoke all sessions for the user
    await db.query('DELETE FROM refresh_tokens WHERE user_id = ?', [userId]);
  }
};

// ── Private helpers ──────────────────────────────────────────────────────────

function _issueTokens(user) {
  const payload = { id: user.id, email: user.email, name: user.name };
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
    expiresIn: JWT_EXPIRES_IN,
  };
}

async function _saveRefreshToken(userId, token) {
  const id = uuidv4();
  const expireDays = parseInt(JWT_REFRESH_EXPIRES_IN) || 7;
  const expiresAt = new Date(Date.now() + expireDays * 24 * 60 * 60 * 1000)
    .toISOString().replace('T', ' ').slice(0, 19);
  await db.query(
    `INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)`,
    [id, userId, token, expiresAt]
  );
}

module.exports = { register, login, refreshToken, logout };
