# FinEdge — Personal Finance & Expense Tracker API

A RESTful API for tracking personal finances: users can log income/expense transactions, set monthly budgets and savings targets, view summary reports and monthly trends, and get auto-categorization of their expenses.

Built with **Node.js, Express, MongoDB (Mongoose)** and fully covered by **Jest + Supertest** tests (TDD).

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Key Design Decisions](#key-design-decisions)

---

## Features

- **User authentication** — secure registration and login with **JWT** tokens; passwords hashed with **bcryptjs**
- **Transaction management** — full CRUD for income/expense entries
- **Auto-categorization** — keyword-matching engine categorizes expenses (e.g. *"Starbucks"* → `food`) when no category is provided
- **Budget & savings tracking** — monthly spending goals and savings targets per user
- **Summary reports** — total income, expenses, and balance per user, served from an in-memory **TTL cache** to avoid recomputing
- **Monthly trends** — aggregation pipeline grouping income/expenses by month
- **Filtering** — list transactions by category and date range
- **Analytics-ready data model** — MongoDB aggregation for insights
- **API hardening** — CORS origin allow-list, rate limiting (60 req/min per IP), central error handling with typed error classes, structured request logging

---

## Assignment Coverage

| Requirement | Sub-feature | Status |
|-------------|-------------|--------|
| **A. Analytics & Reporting** | Calculate total income, expenses, and balance | ✅ `GET /summary` |
| | Filter transactions by category/date | ✅ `GET /transactions?category=&startDate=&endDate=` |
| | Show monthly trends | ✅ `GET /summary/trends` |
| **B. AI or Automation** | Auto-categorize expenses using keyword matching | ✅ `categorizer` service |
| | Suggest saving tips or budgets | ⬜ Not implemented |
| | Real-time updates on new transactions | ⬜ Not implemented |
| **C. Data Persistence** | Store/retrieve data with MongoDB | ✅ Mongoose models |
| **D. Advanced Middleware** | Rate limiter | ✅ `express-rate-limit` |
| | CORS and request logging | ✅ `cors` + `logger` middleware |
| | In-memory cache with TTL on `/summary` | ✅ `CacheService` (60s TTL) |

The two unimplemented items belong to option B (AI/Automation), which was not required once the mandatory options (A and C) were fulfilled.

---

## Tech Stack

| Layer      | Technology                                   |
|------------|----------------------------------------------|
| Runtime    | Node.js                                      |
| Framework  | Express 5                                    |
| Database   | MongoDB + Mongoose (Object Data Modeling)    |
| Auth       | JWT (`jsonwebtoken`), `bcryptjs` hashing     |
| Middleware | `cors`, `express-rate-limit`, `dotenv`       |
| Testing    | Jest, Supertest, `mongodb-memory-server`     |

---

## Getting Started

### Prerequisites

- Node.js (v18 or newer)
- A MongoDB database — either:
  - **MongoDB Atlas** (cloud, used in production config), or
  - A local MongoDB instance

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/<your-username>/finedge.git
cd finedge

# 2. Install dependencies
npm install

# 3. Create the environment file
cp .env.example .env    # then fill in your values (see below)

# 4. Start the server
npm start
```

The server runs at `http://localhost:3000` and the health check is available at `GET /health`.

---

## Environment Variables

Create a `.env` file in the project root based on `.env.example`:

```env
PORT=3000
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/finedge
JWT_SECRET=<a-long-random-secret-string>
RATE_LIMIT_MAX=100
ALLOWED_ORIGINS=http://localhost:3001
```

| Variable           | Required | Description                                             |
|--------------------|----------|---------------------------------------------------------|
| `PORT`             | No       | Server port (default `3000`)                            |
| `MONGO_URI`        | Yes      | MongoDB connection string                               |
| `JWT_SECRET`       | Yes      | Secret used to sign/verify JWT tokens                   |
| `RATE_LIMIT_MAX`   | No       | Max requests per IP per minute (default `100`)          |
| `ALLOWED_ORIGINS`  | No       | Comma-separated list of allowed CORS origins (default `*`) |

---

## API Endpoints

All endpoints (except user registration/login and `/health`) require an `Authorization: Bearer <token>` header.

### Health

| Method | Endpoint  | Description       |
|--------|-----------|-------------------|
| GET    | `/health` | Service health check |

### Users

| Method | Endpoint        | Description                    |
|--------|-----------------|--------------------------------|
| POST   | `/users`        | Register a new user            |
| POST   | `/users/login`  | Login, returns a JWT token     |

**Register**
```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Ankit","email":"ankit@example.com","password":"password123"}'
```

**Login**
```bash
curl -X POST http://localhost:3000/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ankit@example.com","password":"password123"}'
# → { "token": "eyJhbGciOi..." }
```

### Transactions

| Method | Endpoint               | Description                                        |
|--------|------------------------|----------------------------------------------------|
| POST   | `/transactions`        | Create a transaction (with auto-categorization)    |
| GET    | `/transactions`        | List transactions (filter by `category`, `startDate`, `endDate`) |
| GET    | `/transactions/:id`    | Get a transaction by id                            |
| PATCH  | `/transactions/:id`    | Update a transaction                               |
| DELETE | `/transactions/:id`    | Delete a transaction                               |

**Create (category auto-assigned from description)**
```bash
curl -X POST http://localhost:3000/transactions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
        "type": "expense",
        "description": "Starbucks latte",
        "amount": 250,
        "date": "2025-02-01"
      }'
# → { "transaction": { "...": "...", "category": "food" } }
```

If a `category` is provided, it is respected over auto-categorization.

**List with filters**
```text
GET /transactions?category=food&startDate=2025-01-01&endDate=2025-01-31
```

### Summary & Trends

| Method | Endpoint           | Description                                 |
|--------|--------------------|---------------------------------------------|
| GET    | `/summary`         | Total income, expenses, and balance (cached 60s) |
| GET    | `/summary/trends`  | Income/expenses grouped by month            |

**Summary**
```bash
curl http://localhost:3000/summary -H "Authorization: Bearer <token>"
# → { "totalIncome": 50000, "totalExpenses": 20000, "balance": 30000 }
```

### Budgets

| Method | Endpoint        | Description                                   |
|--------|-----------------|-----------------------------------------------|
| POST   | `/budgets`      | Create a budget for a month (`YYYY-MM`)       |
| GET    | `/budgets`      | List the current user's budgets               |
| PATCH  | `/budgets/:id`  | Update a budget                               |

**Create**
```bash
curl -X POST http://localhost:3000/budgets \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"month":"2025-02","monthlyGoal":30000,"savingsTarget":5000}'
```

### Errors

All errors follow a consistent format:

```json
{ "message": "<error description>" }
```

| Status | Meaning                       |
|--------|-------------------------------|
| 400    | Validation error              |
| 401    | Missing/invalid credentials   |
| 404    | Resource not found            |
| 409    | Duplicate resource (e.g. email already registered) |
| 429    | Rate limit exceeded           |
| 500    | Server error                  |

---

## Project Structure

```
src/
├── server.js              # Entry point — connects to DB, starts the HTTP server
├── app.js                 # Express app — middleware wiring, routes, error handler
├── config/
│   ├── db.js              # MongoDB connection logic
│   └── jestSetup.js       # Test setup — spins up mongodb-memory-server
├── models/                # Mongoose schemas
│   ├── userModel.js       # User (email unique, bcrypt-hashed password)
│   ├── transactionModel.js# Transaction (income/expense, amount, category, description)
│   └── budgetModel.js     # Budget (month YYYY-MM, monthlyGoal, savingsTarget)
├── controllers/           # Request handling — parse input, call services, respond
│   ├── userController.js
│   ├── transactionController.js
│   ├── summaryController.js
│   ├── trendsController.js
│   └── budgetController.js
├── services/              # Business logic + data access
│   ├── userService.js
│   ├── transactionService.js
│   ├── budgetService.js
│   ├── categorizer.js     # Keyword-matching auto-categorization engine
│   └── cacheService.js    # In-memory cache with TTL expiry (used by /summary)
├── middleware/            # Express middleware
│   ├── auth.js            # JWT verification
│   ├── validator.js       # Request body validation
│   ├── logger.js          # Request logging
│   ├── rateLimiter.js     # Per-IP rate limiting
│   └── errorHandler.js    # Central error response formatting
├── errors/
│   └── apiError.js        # Typed error classes (400/401/404/409 + base)
├── routes/                # API route definitions
│   ├── userRoutes.js
│   ├── transactionRoutes.js
│   ├── summaryRoutes.js
│   ├── trendsRoutes.js
│   └── budgetRoutes.js
└── __tests__/             # Jest/Supertest test suites (one per component)
    ├── health.test.js
    ├── user.test.js
    ├── auth.test.js
    ├── transaction.test.js
    ├── budget.test.js
    ├── summary.test.js
    ├── trends.test.js
    ├── categorizer.test.js
    ├── cache.test.js
    └── middleware.test.js
```

### How the pieces fit together

1. **Route** maps a URL + HTTP method to a controller function (optionally passing through middleware).
2. **Middleware** runs in order — auth verifies the JWT, validator sanity-checks the payload, the logger records the request.
3. **Controller** extracts validated input, delegates to a service, and shapes the HTTP response.
4. **Service** contains business logic and talks to Mongoose models.
5. **Model** defines the MongoDB schema and validation rules.
6. **Error handler** catches any thrown `ApiError` and formats a consistent response.

---

## Testing

Tests are written first (TDD) and run against an **in-memory MongoDB** (`mongodb-memory-server`), so no real database is needed:

```bash
npm test
```

Run a single test file:

```bash
npx jest src/__tests__/transaction.test.js
```

What's covered:
- Happy paths and edge cases (missing fields, invalid types, duplicate emails, expiry of cached entries)
- Auth protection on every protected route
- Rate limiting (over-limit returns 429)
- CORS (allowed vs. disallowed origins)
- Auto-categorization rules including case-insensitivity and "other" fallback

---

## Key Design Decisions

- **TTL cache for `/summary`** — summary data is re-read from the database on every request. A tiny in-memory cache stores results for 60 seconds keyed by user, so repeated calls skip the DB query.
- **Auto-categorization as a rules engine** — instead of an ML model, a keyword table maps merchant text to categories. Deterministic, testable, and how production categorizers typically start.
- **JWT as the source of truth for the user** — the user id is read from the verified token, never trusted from the request body/query, avoiding id-spoofing between users.
- **Typed error classes** — `ApiError` subclasses carry HTTP status codes, keeping controllers free of ad-hoc `res.status().json()` calls.
- **Route/controller/service separation** — middleware validates request *shape*, controllers manage *resources*, services hold *logic* — a clean, testable layering.