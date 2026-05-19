'use strict';
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { getConnection, end } = require('./connection');
const logger = require('../utils/logger');

const DEFAULT_CATEGORIES = [
  { name: 'Food',      icon: '🍔', color: '#FF6B6B' },
  { name: 'Transport', icon: '🚗', color: '#4ECDC4' },
  { name: 'Bills',     icon: '🧾', color: '#45B7D1' },
  { name: 'Health',    icon: '🏥', color: '#96CEB4' },
  { name: 'Shopping',  icon: '🛍️', color: '#FFEAA7' },
  { name: 'Travel',    icon: '✈️', color: '#DDA0DD' },
  { name: 'Leisure',   icon: '🎮', color: '#98D8C8' },
  { name: 'Other',     icon: '📦', color: '#B0C4DE' },
];

async function seed() {
  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    logger.info('Seeding default categories...');
    for (const cat of DEFAULT_CATEGORIES) {
      await conn.query(
        `INSERT OR IGNORE INTO categories (id, name, icon, color, is_default, user_id)
         VALUES (?, ?, ?, ?, 1, NULL)`,
        [uuidv4(), cat.name, cat.icon, cat.color]
      );
    }
    logger.info(`  ✅ Seeded ${DEFAULT_CATEGORIES.length} default categories`);

    logger.info('Seeding demo users...');
    const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const passwordHash = await bcrypt.hash('Password@123', BCRYPT_ROUNDS);

    const users = [
      { id: uuidv4(), name: 'Alice Demo', email: 'alice@demo.com' },
      { id: uuidv4(), name: 'Bob Demo',   email: 'bob@demo.com' },
    ];
    for (const user of users) {
      await conn.query(
        `INSERT OR IGNORE INTO users (id, name, email, password) VALUES (?, ?, ?, ?)`,
        [user.id, user.name, user.email, passwordHash]
      );
    }
    logger.info(`  ✅ Seeded ${users.length} demo users`);

    const [insertedUsers] = await conn.query(
      `SELECT id FROM users WHERE email IN ('alice@demo.com','bob@demo.com')`
    );
    const [defaultCats] = await conn.query(`SELECT id, name FROM categories WHERE is_default = 1`);
    const catMap = {};
    defaultCats.forEach((c) => { catMap[c.name] = c.id; });

    logger.info('Seeding demo transactions...');
    let txCount = 0;
    const txData = [
      { type: 'income',  amount: 50000, cat: 'Other',     date: '2026-04-01', note: 'Monthly salary' },
      { type: 'expense', amount: 1200,  cat: 'Food',      date: '2026-04-03', note: 'Groceries' },
      { type: 'expense', amount: 450,   cat: 'Transport', date: '2026-04-05', note: 'Bus pass' },
      { type: 'expense', amount: 2000,  cat: 'Bills',     date: '2026-04-07', note: 'Electricity' },
      { type: 'expense', amount: 800,   cat: 'Health',    date: '2026-04-10', note: 'Pharmacy' },
      { type: 'income',  amount: 5000,  cat: 'Other',     date: '2026-04-15', note: 'Freelance' },
      { type: 'expense', amount: 3500,  cat: 'Shopping',  date: '2026-04-18', note: 'New clothes' },
      { type: 'expense', amount: 8000,  cat: 'Travel',    date: '2026-04-25', note: 'Weekend trip' },
      { type: 'income',  amount: 50000, cat: 'Other',     date: '2026-05-01', note: 'Monthly salary' },
      { type: 'expense', amount: 1500,  cat: 'Food',      date: '2026-05-05', note: 'Dining out' },
      { type: 'expense', amount: 2500,  cat: 'Bills',     date: '2026-05-08', note: 'Internet + phone' },
    ];
    for (const user of insertedUsers) {
      for (const tx of txData) {
        const catId = catMap[tx.cat] || catMap['Other'];
        await conn.query(
          `INSERT INTO transactions (id, user_id, category_id, type, amount, date, note)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [uuidv4(), user.id, catId, tx.type, tx.amount, tx.date, tx.note]
        );
        txCount++;
      }
    }
    logger.info(`  ✅ Seeded ${txCount} demo transactions`);

    await conn.commit();
    logger.info('✅ Database seeded successfully!');
    logger.info('  Email: alice@demo.com  |  Password: Password@123');
    logger.info('  Email: bob@demo.com    |  Password: Password@123');
  } catch (err) {
    await conn.rollback();
    logger.error('❌ Seeding failed:', err.message);
    throw err;
  } finally {
    conn.release();
    await end();
  }
}

seed().catch(() => process.exit(1));
