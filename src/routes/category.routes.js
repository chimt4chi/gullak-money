'use strict';
const { Router } = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const categoryController = require('../controllers/category.controller');

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/v1/categories:
 *   get:
 *     summary: List all categories (default + user's custom)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Categories fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     categories:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/Category' }
 */
router.get('/', categoryController.getCategories);

/**
 * @swagger
 * /api/v1/categories/{id}:
 *   get:
 *     summary: Get a single category by ID
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Category fetched
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     category: { $ref: '#/components/schemas/Category' }
 *       404:
 *         description: Category not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.get('/:id', categoryController.getCategory);

/**
 * @swagger
 * /api/v1/categories:
 *   post:
 *     summary: Create a custom category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CategoryInput' }
 *     responses:
 *       201:
 *         description: Category created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     category: { $ref: '#/components/schemas/Category' }
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       409:
 *         description: Category name already exists
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Category name is required.')
      .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters.'),
    body('icon').optional().trim().isLength({ max: 50 }).withMessage('Icon must be at most 50 characters.'),
    body('color').optional().trim().isLength({ max: 20 }).withMessage('Color must be at most 20 characters.'),
  ],
  validate,
  categoryController.createCategory
);

/**
 * @swagger
 * /api/v1/categories/{id}:
 *   patch:
 *     summary: Update a custom category (cannot update defaults)
 *     tags: [Categories]
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
 *           schema: { $ref: '#/components/schemas/CategoryInput' }
 *     responses:
 *       200:
 *         description: Category updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     category: { $ref: '#/components/schemas/Category' }
 *       403:
 *         description: Cannot modify default categories or someone else's category
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       404:
 *         description: Category not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.patch(
  '/:id',
  [
    body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters.'),
    body('icon').optional().trim().isLength({ max: 50 }),
    body('color').optional().trim().isLength({ max: 20 }),
  ],
  validate,
  categoryController.updateCategory
);

/**
 * @swagger
 * /api/v1/categories/{id}:
 *   delete:
 *     summary: Delete a custom category (defaults are protected)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Category deleted
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       403:
 *         description: Cannot delete default categories
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       404:
 *         description: Category not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       409:
 *         description: Category has associated transactions
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;
