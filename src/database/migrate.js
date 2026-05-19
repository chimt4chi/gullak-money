'use strict';
require('dotenv').config();
const { getConnection, end } = require('./connection');
const logger = require('../utils/logger');

async function migrate() {
  const conn = await getConnection();
  try {
    logger.info('Running SQLite migrations...');

    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id         TEXT NOT NULL PRIMARY KEY,
        name       TEXT NOT NULL,
        email      TEXT NOT NULL UNIQUE,
        password   TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
    logger.info('  ✅ Table: users');

    await conn.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id         TEXT NOT NULL PRIMARY KEY,
        user_id    TEXT NOT NULL,
        token      TEXT NOT NULL UNIQUE,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    logger.info('  ✅ Table: refresh_tokens');

    await conn.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id         TEXT    NOT NULL PRIMARY KEY,
        name       TEXT    NOT NULL,
        icon       TEXT    DEFAULT NULL,
        color      TEXT    DEFAULT NULL,
        is_default INTEGER NOT NULL DEFAULT 0,
        user_id    TEXT    DEFAULT NULL,
        created_at TEXT    NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT    NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE (user_id, name)
      )
    `);
    logger.info('  ✅ Table: categories');

    await conn.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id          TEXT NOT NULL PRIMARY KEY,
        user_id     TEXT NOT NULL,
        category_id TEXT NOT NULL,
        type        TEXT NOT NULL CHECK(type IN ('income','expense')),
        amount      REAL NOT NULL,
        date        TEXT NOT NULL,
        note        TEXT DEFAULT NULL,
        created_at  TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id)     REFERENCES users(id)      ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
      )
    `);
    await conn.query(`CREATE INDEX IF NOT EXISTS idx_tx_user_date ON transactions (user_id, date)`);
    await conn.query(`CREATE INDEX IF NOT EXISTS idx_tx_user_type ON transactions (user_id, type)`);
    await conn.query(`CREATE INDEX IF NOT EXISTS idx_tx_category  ON transactions (category_id)`);
    logger.info('  ✅ Table: transactions');

    logger.info('✅ All migrations completed successfully.');
  } catch (err) {
    logger.error('❌ Migration failed:', err.message);
    throw err;
  } finally {
    conn.release();
    await end();
  }
}

migrate().catch(() => process.exit(1));
