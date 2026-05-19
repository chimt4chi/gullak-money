# 💰 Gullak Money — Expense Tracker API

A production-ready REST API powering a personal expense tracker. Built with **Node.js**, **Express**, and **MySQL**, it provides secure JWT-based authentication, full CRUD for transactions and categories, and financial analytics.

---

## Tech Stack & Rationale

| Layer | Choice | Why |
|---|---|---|
| **Runtime** | Node.js 18+ | Non-blocking I/O is ideal for a data-centric REST API; large ecosystem. |
| **Framework** | Express.js | Minimal, battle-tested, gives full control without magic. |
| **Database** | MySQL 8.0 | Relational model fits transactional data well; ACID guarantees; mature. |
| **ORM / Query** | `mysql2/promise` (raw SQL) | Full control over queries, indexes, and joins. No ORM magic to debug. |
| **Auth** | `jsonwebtoken` + `bcryptjs` | Industry-standard JWT; bcrypt with configurable rounds for password hashing. |
| **Validation** | `express-validator` | Declarative, chainable, well-integrated with Express. |
| **Docs** | `swagger-jsdoc` + `swagger-ui-express` | Generates live, testable OpenAPI 3.0 docs from JSDoc comments. |
| **Logging** | `winston` | Structured, levelled logging with file rotation support. |
| **Security** | `helmet` + `express-rate-limit` | Sets secure HTTP headers; prevents brute-force on auth endpoints. |

---

## Architecture

```
src/
├── server.js           — Entry point (starts server after DB check)
├── app.js              — Express app setup (middleware, routes)
├── config/
│   └── swagger.js      — OpenAPI 3.0 spec configuration
├── database/
│   ├── connection.js   — MySQL connection pool
│   ├── migrate.js      — Schema migration script
│   └── seed.js         — Sample data seeder
├── middleware/
│   ├── auth.js         — JWT Bearer token validation
│   ├── errorHandler.js — Global error handler (no stack trace leaks)
│   ├── notFound.js     — 404 handler
│   ├── rateLimiter.js  — Rate limiting (general + strict auth limiter)
│   └── validate.js     — express-validator result handler
├── routes/             — Route definitions + Swagger JSDoc annotations
├── controllers/        — Request/response handling (thin layer)
├── services/           — Business logic (auth, users, transactions, categories, analytics)
└── utils/
    ├── jwt.js          — Token generation & verification helpers
    ├── logger.js       — Winston logger instance
    └── response.js     — Consistent JSON response helpers
tests/
└── integration/        — Supertest integration tests
```

---

## Prerequisites

- **Node.js** ≥ 18
- **MySQL** ≥ 8.0 running locally (or accessible remotely)
- **npm** ≥ 9

---

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/your-username/gullak-money.git
cd gullak-money
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and set your MySQL credentials:

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=gullak_money

JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars
JWT_REFRESH_EXPIRES_IN=7d

BCRYPT_ROUNDS=12

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_MAX=10
```

> ⚠️ **Change JWT secrets before deploying to production!** Use at least 32 random characters.

### 4. Run database migrations

Creates the `gullak_money` database and all tables if they don't exist:

```bash
npm run migrate
```

### 5. (Optional) Seed sample data

Inserts 8 default categories and 2 demo users with sample transactions:

```bash
npm run seed
```

**Demo credentials after seeding:**
```
Email: alice@demo.com | Password: Password@123
Email: bob@demo.com   | Password: Password@123
```

### 6. Start the server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

The API will be available at: `http://localhost:3000`

---

## Running Tests

Requires a running MySQL instance. Tests create and clean up their own data.

```bash
# Run all tests
npm test

# Auth tests only
npm run test:auth

# Transaction tests only
npm run test:transactions
```

---

## API Documentation

Swagger UI is available at:

- **Local:** `http://localhost:3000/docs`
- **Live:** `https://your-deployment-url/docs`

The docs are fully interactive — you can authorize with a Bearer token and test every endpoint directly.

---

## API Overview

### Authentication
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|:---:|
| `POST` | `/api/v1/auth/register` | Register a new user | ❌ |
| `POST` | `/api/v1/auth/login` | Login, receive tokens | ❌ |
| `POST` | `/api/v1/auth/refresh` | Refresh access token | ❌ |
| `POST` | `/api/v1/auth/logout` | Revoke refresh token | ✅ |

### Users
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|:---:|
| `GET` | `/api/v1/users/me` | Get own profile | ✅ |
| `PATCH` | `/api/v1/users/me` | Update name/email | ✅ |
| `PATCH` | `/api/v1/users/me/password` | Change password | ✅ |

### Transactions
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|:---:|
| `GET` | `/api/v1/transactions` | List (filter, sort, paginate) | ✅ |
| `POST` | `/api/v1/transactions` | Create transaction | ✅ |
| `GET` | `/api/v1/transactions/:id` | Get single transaction | ✅ |
| `PATCH` | `/api/v1/transactions/:id` | Update transaction | ✅ |
| `DELETE` | `/api/v1/transactions/:id` | Delete transaction | ✅ |

**Query parameters for `GET /transactions`:**

| Param | Type | Description |
|-------|------|-------------|
| `type` | `income` \| `expense` | Filter by type |
| `category_id` | UUID | Filter by category |
| `date_from` | `YYYY-MM-DD` | Start date |
| `date_to` | `YYYY-MM-DD` | End date |
| `sort_by` | `date` \| `amount` \| `created_at` | Sort field (default: `date`) |
| `sort_order` | `asc` \| `desc` | Sort direction (default: `desc`) |
| `page` | integer | Page number (default: `1`) |
| `limit` | integer (1–100) | Items per page (default: `20`) |

### Categories
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|:---:|
| `GET` | `/api/v1/categories` | List all (default + custom) | ✅ |
| `GET` | `/api/v1/categories/:id` | Get single category | ✅ |
| `POST` | `/api/v1/categories` | Create custom category | ✅ |
| `PATCH` | `/api/v1/categories/:id` | Update custom category | ✅ |
| `DELETE` | `/api/v1/categories/:id` | Delete custom category | ✅ |

> Default categories (Food, Transport, Bills, etc.) **cannot** be modified or deleted.

### Analytics
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|:---:|
| `GET` | `/api/v1/analytics/summary` | Income, expenses, net balance | ✅ |
| `GET` | `/api/v1/analytics/breakdown` | Spending by category + percentages | ✅ |
| `GET` | `/api/v1/analytics/monthly-trend` | Month-over-month summary | ✅ |

---

## Security Design

### Token Lifecycle
- **Access token**: Short-lived (15 min), signed with `JWT_SECRET`. Sent as `Bearer` header.
- **Refresh token**: Long-lived (7 days), signed with a different `JWT_REFRESH_SECRET`, stored in DB.
- On refresh, the old refresh token is **rotated** (deleted, new one issued) — preventing replay attacks.
- Logout revokes the specific refresh token (or all sessions if none provided).

### Authorization
- Every protected route validates the JWT before any data access.
- All data queries include `WHERE user_id = :current_user_id` — it is **architecturally impossible** for a user to access another user's data.
- Categories: users can only mutate categories they own; default categories are immutable.

### Password Security
- Passwords are hashed with `bcrypt` at 12 rounds before storage.
- Plain-text passwords are **never** stored or logged.
- Password change requires current password verification.

---

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | Success |
| `201` | Resource created |
| `400` | Validation error / bad request |
| `401` | Authentication required or token expired |
| `403` | Forbidden (authenticated but not authorized) |
| `404` | Resource not found |
| `409` | Conflict (duplicate email, protected category, etc.) |
| `429` | Rate limit exceeded |
| `500` | Internal server error |

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|:--------:|---------|-------------|
| `PORT` | ❌ | `3000` | Server port |
| `NODE_ENV` | ❌ | `development` | Environment mode |
| `DB_HOST` | ✅ | `localhost` | MySQL host |
| `DB_PORT` | ❌ | `3306` | MySQL port |
| `DB_USER` | ✅ | — | MySQL username |
| `DB_PASSWORD` | ✅ | — | MySQL password |
| `DB_NAME` | ✅ | `gullak_money` | Database name |
| `JWT_SECRET` | ✅ | — | Secret for access tokens |
| `JWT_EXPIRES_IN` | ❌ | `15m` | Access token expiry |
| `JWT_REFRESH_SECRET` | ✅ | — | Secret for refresh tokens |
| `JWT_REFRESH_EXPIRES_IN` | ❌ | `7d` | Refresh token expiry |
| `BCRYPT_ROUNDS` | ❌ | `12` | bcrypt cost factor |
| `RATE_LIMIT_MAX` | ❌ | `100` | General rate limit (per 15 min) |
| `AUTH_RATE_LIMIT_MAX` | ❌ | `10` | Auth endpoint rate limit |

---

## Deployment (Render with SQLite)

Since we are using SQLite, we can deploy the API as a **Render Web Service** and persist our database using a **Render Persistent Disk**.

### 1. Create a Web Service
- Connect your GitHub repository to Render.
- Set **Runtime** to `Node`.
- Set **Build Command** to: `npm install && npm run migrate`
- Set **Start Command** to: `npm start`

### 2. Add a Persistent Disk
- Go to the **Disks** section in your Render Service settings.
- Click **Add Disk**.
- Name: `gullak-db` (or any name).
- Mount Path: `/data`
- Size: `1 GB` (or minimum size, since SQLite database is small).

### 3. Configure Environment Variables
In the **Env Groups** or **Environment** section of your service, add the following:

| Key | Value | Description |
|---|---|---|
| `NODE_ENV` | `production` | Production environment |
| `DB_PATH` | `/data/gullak_money.sqlite` | Points to the persistent disk path |
| `JWT_SECRET` | `your-secure-production-jwt-secret` | Generate a 32+ character key |
| `JWT_REFRESH_SECRET` | `your-secure-production-refresh-secret` | Generate another 32+ character key |

### 4. (Optional) Seeding Demo Data
To populate the production database with the 8 default categories and demo transactions, you can run the seed script once after the service is successfully deployed:
- Go to the **Shell** tab in the Render Dashboard.
- Run: `npm run seed`

---

## Assumptions & Trade-offs

1. **UUID v4 for IDs** — Chosen over auto-increment integers for better distribution and to avoid exposing sequential resource counts.
2. **Raw SQL over ORM** — Intentional for full control and performance visibility. Prisma/TypeORM would add abstraction but hide query behavior.
3. **Refresh token stored in DB** — Enables true revocation (logout). Pure stateless JWT would not allow this. The trade-off is one extra DB lookup on refresh.
4. **No soft deletes** — Transactions and categories are hard-deleted. A production system might use `deleted_at` for audit trails.
5. **Single timezone (UTC)** — All dates stored in UTC. Client-side timezone handling is expected at the frontend layer.
6. **Category delete protection** — If a category has transactions, deletion is blocked (returns 409). Users must reassign or delete transactions first.

---

## What I'd Improve With More Time

- [ ] **Soft deletes** with `deleted_at` for audit trail compliance
- [ ] **Redis caching** for analytics endpoints (heavy aggregations)
- [ ] **File upload** for transaction receipts (S3 / Cloudflare R2)
- [ ] **Recurring transactions** (weekly/monthly auto-create)
- [ ] **Budget limits** per category with over-budget alerts
- [ ] **Export to CSV/PDF** for statements
- [ ] **Email verification** on registration
- [ ] **OAuth2** (Google/GitHub) as optional login method
- [ ] **Database migrations versioning** with a proper migration framework (Flyway / Liquibase)
- [ ] **More granular test coverage** — unit tests for services, mocking DB calls

---

## Health Check

```
GET /health
```

Returns server status, timestamp, and version. Useful for deployment health probes.
# gullak-money
