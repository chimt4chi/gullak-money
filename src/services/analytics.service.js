'use strict';
const db = require('../database/connection');

/**
 * Total income, expenses, and net balance for a date range
 */
const getSummary = async (userId, { date_from, date_to }) => {
  const conditions = ['user_id = ?'];
  const params = [userId];

  if (date_from) { conditions.push('date >= ?'); params.push(date_from); }
  if (date_to)   { conditions.push('date <= ?'); params.push(date_to); }

  const where = `WHERE ${conditions.join(' AND ')}`;

  const [rows] = await db.query(
    `SELECT
       COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END), 0) AS total_income,
       COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expenses
     FROM transactions
     ${where}`,
    params
  );

  const { total_income, total_expenses } = rows[0];
  return {
    total_income:   parseFloat(total_income),
    total_expenses: parseFloat(total_expenses),
    net_balance:    parseFloat(total_income) - parseFloat(total_expenses),
    period: {
      from: date_from || null,
      to:   date_to   || null,
    },
  };
};

/**
 * Spending breakdown by category for a given period
 */
const getCategoryBreakdown = async (userId, { date_from, date_to, type = 'expense' }) => {
  const conditions = ['t.user_id = ?', 't.type = ?'];
  const params = [userId, type];

  if (date_from) { conditions.push('t.date >= ?'); params.push(date_from); }
  if (date_to)   { conditions.push('t.date <= ?'); params.push(date_to); }

  const where = `WHERE ${conditions.join(' AND ')}`;

  const [rows] = await db.query(
    `SELECT
       c.id   AS category_id,
       c.name AS category_name,
       c.icon AS category_icon,
       c.color AS category_color,
       COALESCE(SUM(t.amount), 0) AS total_amount,
       COUNT(t.id) AS transaction_count
     FROM categories c
     LEFT JOIN transactions t ON t.category_id = c.id AND t.user_id = ? AND t.type = ?
       ${date_from ? 'AND t.date >= ?' : ''}
       ${date_to   ? 'AND t.date <= ?' : ''}
     WHERE (c.is_default = 1 OR c.user_id = ?)
     GROUP BY c.id, c.name, c.icon, c.color
     ORDER BY total_amount DESC`,
    [
      userId, type,
      ...(date_from ? [date_from] : []),
      ...(date_to   ? [date_to]   : []),
      userId,
    ]
  );

  // Calculate percentages
  const grandTotal = rows.reduce((sum, r) => sum + parseFloat(r.total_amount), 0);

  return rows.map((r) => ({
    category_id:       r.category_id,
    category_name:     r.category_name,
    category_icon:     r.category_icon,
    category_color:    r.category_color,
    total_amount:      parseFloat(r.total_amount),
    transaction_count: r.transaction_count,
    percentage:        grandTotal > 0
      ? parseFloat(((r.total_amount / grandTotal) * 100).toFixed(2))
      : 0,
  }));
};

/**
 * Month-over-month summary for the last N months
 */
const getMonthlyTrend = async (userId, { months = 6 }) => {
  const safeMonths = Math.min(24, Math.max(1, parseInt(months)));

  const [rows] = await db.query(
    `SELECT
       strftime('%Y-%m', date) AS month,
       COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END), 0) AS total_income,
       COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expenses
     FROM transactions
     WHERE user_id = ?
       AND date >= date('now', '-' || ? || ' months')
     GROUP BY strftime('%Y-%m', date)
     ORDER BY month ASC`,
    [userId, safeMonths]
  );

  return rows.map((r) => ({
    month:          r.month,
    total_income:   parseFloat(r.total_income),
    total_expenses: parseFloat(r.total_expenses),
    net_balance:    parseFloat(r.total_income) - parseFloat(r.total_expenses),
  }));
};

module.exports = { getSummary, getCategoryBreakdown, getMonthlyTrend };
