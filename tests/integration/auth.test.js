'use strict';
require('dotenv').config({ path: '.env' });

const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/database/connection');

describe('Auth API', () => {
  const testUser = {
    name: 'Test User',
    email: `test_${Date.now()}@example.com`,
    password: 'Password@123',
  };
  let accessToken;
  let refreshToken;

  afterAll(async () => {
    // Clean up test user
    await db.query('DELETE FROM users WHERE email = ?', [testUser.email]);
    await db.end();
  });

  // ── Register ──────────────────────────────────────────────────────────────
  describe('POST /api/v1/auth/register', () => {
    it('should register a new user and return tokens', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testUser.email);
      expect(res.body.data.tokens.accessToken).toBeDefined();
      expect(res.body.data.tokens.refreshToken).toBeDefined();

      refreshToken = res.body.data.tokens.refreshToken;
    });

    it('should return 409 if email is already registered', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for invalid email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ name: 'Test', email: 'not-an-email', password: 'Password@123' });

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    it('should return 400 for weak password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ name: 'Test', email: 'new@test.com', password: 'weak' });

      expect(res.status).toBe(400);
    });

    it('should return 400 when name is missing', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'new2@test.com', password: 'Password@123' });

      expect(res.status).toBe(400);
    });
  });

  // ── Login ─────────────────────────────────────────────────────────────────
  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: testUser.password });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tokens.accessToken).toBeDefined();

      accessToken = res.body.data.tokens.accessToken;
      refreshToken = res.body.data.tokens.refreshToken;
    });

    it('should return 401 for wrong password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: 'WrongPass@123' });

      expect(res.status).toBe(401);
    });

    it('should return 401 for non-existent email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'nobody@example.com', password: 'Password@123' });

      expect(res.status).toBe(401);
    });
  });

  // ── Refresh ───────────────────────────────────────────────────────────────
  describe('POST /api/v1/auth/refresh', () => {
    it('should issue a new access token with valid refresh token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.data.tokens.accessToken).toBeDefined();
      // Update for rotate
      refreshToken = res.body.data.tokens.refreshToken;
    });

    it('should return 401 for invalid refresh token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid.token.here' });

      expect(res.status).toBe(401);
    });
  });

  // ── Protected Route ────────────────────────────────────────────────────────
  describe('GET /api/v1/users/me', () => {
    it('should return user profile with valid access token', async () => {
      const res = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe(testUser.email);
    });

    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/v1/users/me');
      expect(res.status).toBe(401);
    });

    it('should return 401 with malformed token', async () => {
      const res = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', 'Bearer not.a.valid.token');

      expect(res.status).toBe(401);
    });
  });

  // ── Logout ─────────────────────────────────────────────────────────────────
  describe('POST /api/v1/auth/logout', () => {
    it('should logout and revoke refresh token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject the revoked refresh token after logout', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(res.status).toBe(401);
    });
  });
});
