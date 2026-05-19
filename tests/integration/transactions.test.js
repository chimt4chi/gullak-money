'use strict';
require('dotenv').config({ path: '.env' });

const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/database/connection');

describe('Transactions API', () => {
  let accessToken;
  let userId;
  let categoryId;
  let transactionId;

  const testUser = {
    name: 'Tx Test User',
    email: `tx_test_${Date.now()}@example.com`,
    password: 'Password@123',
  };

  beforeAll(async () => {
    // Register and login
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser);

    accessToken = res.body.data.tokens.accessToken;
    userId = res.body.data.user.id;

    // Get a default category ID to use in transactions
    const catRes = await request(app)
      .get('/api/v1/categories')
      .set('Authorization', `Bearer ${accessToken}`);

    categoryId = catRes.body.data.categories[0].id;
  });

  afterAll(async () => {
    await db.query('DELETE FROM users WHERE email = ?', [testUser.email]);
    await db.end();
  });

  // ── Create ─────────────────────────────────────────────────────────────────
  describe('POST /api/v1/transactions', () => {
    it('should create an expense transaction', async () => {
      const res = await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          category_id: categoryId,
          type: 'expense',
          amount: 500.50,
          date: '2026-05-01',
          note: 'Test expense',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.transaction.type).toBe('expense');
      expect(parseFloat(res.body.data.transaction.amount)).toBe(500.50);

      transactionId = res.body.data.transaction.id;
    });

    it('should return 400 for missing required fields', async () => {
      const res = await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ type: 'expense', amount: 100 }); // missing category_id and date

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    it('should return 400 for negative amount', async () => {
      const res = await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ category_id: categoryId, type: 'expense', amount: -50, date: '2026-05-01' });

      expect(res.status).toBe(400);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app)
        .post('/api/v1/transactions')
        .send({ category_id: categoryId, type: 'expense', amount: 100, date: '2026-05-01' });

      expect(res.status).toBe(401);
    });
  });

  // ── List ───────────────────────────────────────────────────────────────────
  describe('GET /api/v1/transactions', () => {
    it('should return paginated list of transactions', async () => {
      const res = await request(app)
        .get('/api/v1/transactions')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.total).toBeGreaterThanOrEqual(1);
    });

    it('should filter by type=expense', async () => {
      const res = await request(app)
        .get('/api/v1/transactions?type=expense')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      res.body.data.forEach((tx) => expect(tx.type).toBe('expense'));
    });

    it('should filter by date range', async () => {
      const res = await request(app)
        .get('/api/v1/transactions?date_from=2026-05-01&date_to=2026-05-31')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
    });

    it('should respect pagination params', async () => {
      const res = await request(app)
        .get('/api/v1/transactions?page=1&limit=1')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeLessThanOrEqual(1);
      expect(res.body.pagination.limit).toBe(1);
    });

    it('should return 400 for invalid sort_by param', async () => {
      const res = await request(app)
        .get('/api/v1/transactions?sort_by=invalid')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(400);
    });
  });

  // ── Get One ────────────────────────────────────────────────────────────────
  describe('GET /api/v1/transactions/:id', () => {
    it('should return a specific transaction', async () => {
      const res = await request(app)
        .get(`/api/v1/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.transaction.id).toBe(transactionId);
    });

    it('should return 404 for non-existent transaction', async () => {
      const res = await request(app)
        .get('/api/v1/transactions/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ── Update ─────────────────────────────────────────────────────────────────
  describe('PATCH /api/v1/transactions/:id', () => {
    it('should update a transaction', async () => {
      const res = await request(app)
        .patch(`/api/v1/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ amount: 750.00, note: 'Updated note' });

      expect(res.status).toBe(200);
      expect(parseFloat(res.body.data.transaction.amount)).toBe(750.00);
      expect(res.body.data.transaction.note).toBe('Updated note');
    });

    it('should return 404 for non-existent transaction', async () => {
      const res = await request(app)
        .patch('/api/v1/transactions/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ amount: 100 });

      expect(res.status).toBe(404);
    });
  });

  // ── Delete ─────────────────────────────────────────────────────────────────
  describe('DELETE /api/v1/transactions/:id', () => {
    it('should delete a transaction', async () => {
      const res = await request(app)
        .delete(`/api/v1/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 for already deleted transaction', async () => {
      const res = await request(app)
        .delete(`/api/v1/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ── Data Isolation ─────────────────────────────────────────────────────────
  describe('Authorization: data isolation', () => {
    let otherToken;
    let otherTxId;
    const otherUser = { name: 'Other', email: `other_${Date.now()}@example.com`, password: 'Password@123' };

    beforeAll(async () => {
      const res = await request(app).post('/api/v1/auth/register').send(otherUser);
      otherToken = res.body.data.tokens.accessToken;

      // Create a tx for the other user
      const txRes = await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ category_id: categoryId, type: 'income', amount: 1000, date: '2026-05-01' });

      otherTxId = txRes.body.data.transaction.id;
    });

    afterAll(async () => {
      await db.query('DELETE FROM users WHERE email = ?', [otherUser.email]);
    });

    it('should not allow user A to read user B\'s transaction', async () => {
      const res = await request(app)
        .get(`/api/v1/transactions/${otherTxId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
    });

    it('should not allow user A to delete user B\'s transaction', async () => {
      const res = await request(app)
        .delete(`/api/v1/transactions/${otherTxId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
    });
  });
});
