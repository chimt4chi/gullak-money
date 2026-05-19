'use strict';
const { Router } = require('express');
const { body, query } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const transactionController = require('../controllers/transaction.controller');

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/v1/transactions:
 *   get:
 *     summary: List transactions with filtering, sorting, and pagination
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [income, expense] }
 *         description: Filter by transaction type
 *       - in: query
 *         name: category_id
 *         schema: { type: string, format: uuid }
 *         description: Filter by category ID
 *       - in: query
 *         name: date_from
 *         schema: { type: string, format: date }
 *         description: Start date filter (YYYY-MM-DD)
 *       - in: query
 *         name: date_to
 *         schema: { type: string, format: date }
 *         description: End date filter (YYYY-MM-DD)
 *       - in: query
 *         name: sort_by
 *         schema: { type: string, enum: [date, amount, created_at], default: date }
 *       - in: query
 *         name: sort_order
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
 *     responses:
 *       200:
 *         description: Transactions fetched with pagination metadata
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Transaction' }
 *                 pagination: { $ref: '#/components/schemas/Pagination' }
 */
router.get(
  '/',
  [
    query('type').optional().isIn(['income', 'expense']).withMessage('Type must be income or expense.'),
    query('date_from').optional().isDate().withMessage('date_from must be a valid date (YYYY-MM-DD).'),
    query('date_to').optional().isDate().withMessage('date_to must be a valid date (YYYY-MM-DD).'),
    query('sort_by').optional().isIn(['date', 'amount', 'created_at']).withMessage('sort_by must be date, amount, or created_at.'),
    query('sort_order').optional().isIn(['asc', 'desc']).withMessage('sort_order must be asc or desc.'),
    query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer.'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100.'),
  ],
  validate,
  transactionController.getTransactions
);

/**
 * @swagger
 * /api/v1/transactions/{id}:
 *   get:
 *     summary: Get a single transaction by ID
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Transaction fetched
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     transaction: { $ref: '#/components/schemas/Transaction' }
 *       404:
 *         description: Transaction not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.get('/:id', transactionController.getTransaction);

/**
 * @swagger
 * /api/v1/transactions:
 *   post:
 *     summary: Create a new transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/TransactionInput' }
 *     responses:
 *       201:
 *         description: Transaction created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     transaction: { $ref: '#/components/schemas/Transaction' }
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       404:
 *         description: Category not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.post(
  '/',
  [
    body('category_id').notEmpty().withMessage('category_id is required.')
      .isUUID().withMessage('category_id must be a valid UUID.'),
    body('type').notEmpty().withMessage('type is required.')
      .isIn(['income', 'expense']).withMessage('type must be income or expense.'),
    body('amount').notEmpty().withMessage('amount is required.')
      .isFloat({ min: 0.01 }).withMessage('amount must be a positive number.'),
    body('date').notEmpty().withMessage('date is required.')
      .isDate().withMessage('date must be a valid date (YYYY-MM-DD).'),
    body('note').optional().trim().isLength({ max: 500 }).withMessage('Note cannot exceed 500 characters.'),
  ],
  validate,
  transactionController.createTransaction
);

/**
 * @swagger
 * /api/v1/transactions/{id}:
 *   patch:
 *     summary: Update a transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/TransactionInput' }
 *     responses:
 *       200:
 *         description: Transaction updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     transaction: { $ref: '#/components/schemas/Transaction' }
 *       404:
 *         description: Transaction not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.patch(
  '/:id',
  [
    body('category_id').optional().isUUID().withMessage('category_id must be a valid UUID.'),
    body('type').optional().isIn(['income', 'expense']).withMessage('type must be income or expense.'),
    body('amount').optional().isFloat({ min: 0.01 }).withMessage('amount must be a positive number.'),
    body('date').optional().isDate().withMessage('date must be a valid date (YYYY-MM-DD).'),
    body('note').optional().trim().isLength({ max: 500 }),
  ],
  validate,
  transactionController.updateTransaction
);

/**
 * @swagger
 * /api/v1/transactions/{id}:
 *   delete:
 *     summary: Delete a transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Transaction deleted
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       404:
 *         description: Transaction not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.delete('/:id', transactionController.deleteTransaction);

module.exports = router;
