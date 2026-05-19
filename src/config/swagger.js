'use strict';
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Gullak Money — Expense Tracker API',
      version: '1.0.0',
      description: `
## Personal Expense Tracker REST API

A secure, well-structured REST API for managing personal financial transactions.

### Key Features
- **JWT Authentication** with access & refresh token pattern
- **Role-based data isolation** — users only access their own data
- **Full CRUD** for transactions and categories
- **Analytics** — totals, category breakdown, month-over-month summaries
- **Filtering, Pagination & Sorting** on transaction lists

### Authentication
Use the \`/api/v1/auth/login\` endpoint to get a JWT access token.  
Pass it as \`Bearer <token>\` in the \`Authorization\` header on all protected routes.

Access tokens expire in **15 minutes**. Use \`/api/v1/auth/refresh\` with your refresh token to get a new access token.
      `,
      contact: { name: 'Gullak Money API', email: 'support@gullak.money' },
      license: { name: 'MIT' },
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Local Development' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT access token',
        },
      },
      schemas: {
        // ── Common ─────────────────────────────────────────────────────────────
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: { type: 'object' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            errors: { type: 'array', items: { type: 'object' } },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page:       { type: 'integer', example: 1 },
            limit:      { type: 'integer', example: 20 },
            total:      { type: 'integer', example: 100 },
            totalPages: { type: 'integer', example: 5 },
          },
        },
        // ── User ───────────────────────────────────────────────────────────────
        User: {
          type: 'object',
          properties: {
            id:         { type: 'string', format: 'uuid' },
            name:       { type: 'string', example: 'Alice Demo' },
            email:      { type: 'string', format: 'email' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        // ── Auth ───────────────────────────────────────────────────────────────
        RegisterInput: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name:     { type: 'string', minLength: 2, maxLength: 100, example: 'Alice Demo' },
            email:    { type: 'string', format: 'email', example: 'alice@demo.com' },
            password: { type: 'string', minLength: 8, example: 'Password@123' },
          },
        },
        LoginInput: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email:    { type: 'string', format: 'email', example: 'alice@demo.com' },
            password: { type: 'string', example: 'Password@123' },
          },
        },
        AuthTokens: {
          type: 'object',
          properties: {
            accessToken:  { type: 'string' },
            refreshToken: { type: 'string' },
            expiresIn:    { type: 'string', example: '15m' },
          },
        },
        // ── Category ───────────────────────────────────────────────────────────
        Category: {
          type: 'object',
          properties: {
            id:         { type: 'string', format: 'uuid' },
            name:       { type: 'string', example: 'Food' },
            icon:       { type: 'string', example: '🍔' },
            color:      { type: 'string', example: '#FF6B6B' },
            is_default: { type: 'boolean' },
            user_id:    { type: 'string', format: 'uuid', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        CategoryInput: {
          type: 'object',
          required: ['name'],
          properties: {
            name:  { type: 'string', minLength: 2, maxLength: 100, example: 'Gym' },
            icon:  { type: 'string', maxLength: 50, example: '💪' },
            color: { type: 'string', maxLength: 20, example: '#FF5733' },
          },
        },
        // ── Transaction ────────────────────────────────────────────────────────
        Transaction: {
          type: 'object',
          properties: {
            id:            { type: 'string', format: 'uuid' },
            user_id:       { type: 'string', format: 'uuid' },
            category_id:   { type: 'string', format: 'uuid' },
            category_name: { type: 'string', example: 'Food' },
            category_icon: { type: 'string', example: '🍔' },
            type:          { type: 'string', enum: ['income', 'expense'] },
            amount:        { type: 'number', format: 'float', example: 1200.50 },
            date:          { type: 'string', format: 'date', example: '2026-05-01' },
            note:          { type: 'string', nullable: true },
            created_at:    { type: 'string', format: 'date-time' },
            updated_at:    { type: 'string', format: 'date-time' },
          },
        },
        TransactionInput: {
          type: 'object',
          required: ['category_id', 'type', 'amount', 'date'],
          properties: {
            category_id: { type: 'string', format: 'uuid' },
            type:        { type: 'string', enum: ['income', 'expense'] },
            amount:      { type: 'number', minimum: 0.01, example: 1200.50 },
            date:        { type: 'string', format: 'date', example: '2026-05-01' },
            note:        { type: 'string', maxLength: 500, nullable: true },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth',         description: 'Authentication & token management' },
      { name: 'Users',        description: 'User profile management' },
      { name: 'Transactions', description: 'Income and expense transactions' },
      { name: 'Categories',   description: 'Transaction categories' },
      { name: 'Analytics',    description: 'Financial analytics and summaries' },
    ],
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = { swaggerUi, swaggerSpec };
