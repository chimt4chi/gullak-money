'use strict';
const { Router } = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const userController = require('../controllers/user.controller');

const router = Router();

// All user routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/v1/users/me:
 *   get:
 *     summary: Get current user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     user: { $ref: '#/components/schemas/User' }
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.get('/me', userController.getProfile);

/**
 * @swagger
 * /api/v1/users/me:
 *   patch:
 *     summary: Update current user's profile (name and/or email)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:  { type: string, minLength: 2, maxLength: 100 }
 *               email: { type: string, format: email }
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     user: { $ref: '#/components/schemas/User' }
 *       400:
 *         description: Validation error or no fields provided
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       409:
 *         description: Email already in use
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.patch(
  '/me',
  [
    body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters.'),
    body('email').optional().trim().isEmail().withMessage('Valid email is required.').normalizeEmail(),
  ],
  validate,
  userController.updateProfile
);

/**
 * @swagger
 * /api/v1/users/me/password:
 *   patch:
 *     summary: Change password (requires current password verification)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: The user's existing password
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 description: New password (min 8 chars, 1 upper, 1 lower, 1 digit)
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       400:
 *         description: Current password incorrect or validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.patch(
  '/me/password',
  [
    body('currentPassword').notEmpty().withMessage('Current password is required.'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters.')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain uppercase, lowercase, and a number.'),
  ],
  validate,
  userController.changePassword
);

module.exports = router;
