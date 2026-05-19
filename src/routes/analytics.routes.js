'use strict';
const { Router } = require('express');
const { query } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const analyticsController = require('../controllers/analytics.controller');

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/v1/analytics/summary:
 *   get:
 *     summary: Total income, expenses, and net balance for a period
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date_from
 *         schema: { type: string, format: date }
 *         description: Start date (YYYY-MM-DD). Omit for all-time.
 *       - in: query
 *         name: date_to
 *         schema: { type: string, format: date }
 *         description: End date (YYYY-MM-DD). Omit for all-time.
 *     responses:
 *       200:
 *         description: Summary fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     summary:
 *                       type: object
 *                       properties:
 *                         total_income:   { type: number, example: 55000.00 }
 *                         total_expenses: { type: number, example: 18450.00 }
 *                         net_balance:    { type: number, example: 36550.00 }
 *                         period:
 *                           type: object
 *                           properties:
 *                             from: { type: string, format: date, nullable: true }
 *                             to:   { type: string, format: date, nullable: true }
 */
router.get(
  '/summary',
  [
    query('date_from').optional().isDate().withMessage('date_from must be YYYY-MM-DD.'),
    query('date_to').optional().isDate().withMessage('date_to must be YYYY-MM-DD.'),
  ],
  validate,
  analyticsController.getSummary
);

/**
 * @swagger
 * /api/v1/analytics/breakdown:
 *   get:
 *     summary: Spending breakdown by category with percentages
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [income, expense], default: expense }
 *         description: Transaction type to break down
 *       - in: query
 *         name: date_from
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: date_to
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Category breakdown fetched
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     breakdown:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           category_id:       { type: string, format: uuid }
 *                           category_name:     { type: string }
 *                           category_icon:     { type: string }
 *                           category_color:    { type: string }
 *                           total_amount:      { type: number }
 *                           transaction_count: { type: integer }
 *                           percentage:        { type: number, example: 35.5 }
 */
router.get(
  '/breakdown',
  [
    query('type').optional().isIn(['income', 'expense']).withMessage('type must be income or expense.'),
    query('date_from').optional().isDate().withMessage('date_from must be YYYY-MM-DD.'),
    query('date_to').optional().isDate().withMessage('date_to must be YYYY-MM-DD.'),
  ],
  validate,
  analyticsController.getCategoryBreakdown
);

/**
 * @swagger
 * /api/v1/analytics/monthly-trend:
 *   get:
 *     summary: Month-over-month income and expense summary
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: months
 *         schema: { type: integer, minimum: 1, maximum: 24, default: 6 }
 *         description: Number of past months to include (1–24)
 *     responses:
 *       200:
 *         description: Monthly trend fetched
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     trend:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           month:          { type: string, example: '2026-04' }
 *                           total_income:   { type: number }
 *                           total_expenses: { type: number }
 *                           net_balance:    { type: number }
 */
router.get(
  '/monthly-trend',
  [
    query('months').optional().isInt({ min: 1, max: 24 }).withMessage('months must be between 1 and 24.'),
  ],
  validate,
  analyticsController.getMonthlyTrend
);

module.exports = router;
