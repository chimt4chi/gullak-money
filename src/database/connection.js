'use strict';
const path = require('path');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3').verbose();
const logger = require('../utils/logger');

let _db;

async function getDB() {
  if (!_db) {
    const dbPath = process.env.DB_PATH || path.resolve(__dirname, '../../gullak_money.sqlite');
    _db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    await _db.run('PRAGMA foreign_keys = ON');
    await _db.run('PRAGMA journal_mode = WAL');
    logger.debug('SQLite database opened');
  }
  return _db;
}

/**
 * Mimics mysql2's pool.query() — returns [rows] for SELECT, [{ affectedRows }] for writes.
 */
async function query(sql, params = []) {
  const db = await getDB();
  const type = sql.trim().toUpperCase().split(' ')[0];
  if (['SELECT', 'WITH', 'PRAGMA'].includes(type)) {
    const rows = await db.all(sql, params);
    return [rows];
  }
  const result = await db.run(sql, params);
  return [{ affectedRows: result.changes || 0, insertId: result.lastID || 0 }];
}

/**
 * Mimics mysql2's pool.getConnection() — returns connection with transaction support.
 */
async function getConnection() {
  const db = await getDB();
  const conn = {
    query: async (sql, params = []) => {
      const type = sql.trim().toUpperCase().split(' ')[0];
      if (['SELECT', 'WITH', 'PRAGMA'].includes(type)) {
        return [await db.all(sql, params)];
      }
      const r = await db.run(sql, params);
      return [{ affectedRows: r.changes || 0, insertId: r.lastID || 0 }];
    },
    beginTransaction: () => db.run('BEGIN'),
    commit:           () => db.run('COMMIT'),
    rollback:         () => db.run('ROLLBACK'),
    release:          () => {},
  };
  return conn;
}

async function end() {
  if (_db) { await _db.close(); _db = null; }
}

module.exports = { query, getConnection, end };
