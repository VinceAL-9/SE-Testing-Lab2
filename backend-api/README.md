# Backend API – Express + Supabase

A RESTful API built with **Express** and **Supabase** (PostgreSQL) for managing users. Tests use **Jest** and **Supertest** with two strategies:

1. **Unit tests** – Supabase is fully mocked so they run instantly without a network connection.
2. **Integration tests** – Hit the real Supabase database, clearing it before each test to ensure a fresh state.

## Tech Stack

- **Express 5** – HTTP framework
- **Supabase JS** – PostgreSQL client
- **TypeScript** – Type safety
- **Jest + ts-jest** – Test runner
- **Supertest** – HTTP assertion library

## Prerequisites

- Node.js ≥ 18
- npm
- A Supabase project with the `users` table created (see `setup.sql` in the repo root)

## Getting Started

### 1. Install dependencies

```bash
cd backend-api
npm install
```

### 2. Configure environment variables

Copy the example file and fill in your Supabase credentials:

```bash
cp .env.example .env
```

Edit `.env`:

```
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_KEY=your-anon-public-key
PORT=3000
```

> **Never commit `.env` to version control.**

### 3. Database setup

The database should already be set up in Supabase using the SQL file at the repository root (`setup.sql`). It creates a `users` table with:

| Column | Type    | Notes                              |
| ------ | ------- | ---------------------------------- |
| id     | int8    | Primary Key, auto-generated        |
| name   | text    | Required                           |
| age    | integer | Required                           |

### 4. Start the server

```bash
npx ts-node src/server.ts
```

The server will start on `http://localhost:3000` (or the port set in `.env`).

## API Endpoints

| Method | Route            | Description          |
| ------ | ---------------- | -------------------- |
| GET    | `/api/users`     | Fetch all users      |
| GET    | `/api/users/:id` | Fetch a user by ID   |
| POST   | `/api/users`     | Create a new user    |
| DELETE | `/api/users/:id` | Delete a user by ID  |

### Example requests

**Create a user:**

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice", "age": 25}'
```

**Fetch all users:**

```bash
curl http://localhost:3000/api/users
```

**Fetch a single user:**

```bash
curl http://localhost:3000/api/users/1
```

**Delete a user:**

```bash
curl -X DELETE http://localhost:3000/api/users/1
```

## Running Tests

### Run all tests (unit + integration)

```bash
npm test
```

### Run only unit tests (mocked, no DB needed)

```bash
npx jest users.test.ts --runInBand
```

### Run only integration tests (requires real Supabase credentials in `.env`)

```bash
npx jest users.integration.test.ts --runInBand
```

### Unit test coverage (mocked)

Each endpoint has **happy path** and **sad path** tests with Supabase fully mocked:

| Endpoint              | Happy Path                       | Sad Path(s)                                                   |
| --------------------- | -------------------------------- | ------------------------------------------------------------- |
| GET /api/users        | Returns list of users            | 500 on database error                                         |
| GET /api/users/:id    | Returns a single user            | 404 if not found, 400 for invalid ID                          |
| POST /api/users       | Creates and returns the new user | 400 if fields missing, 500 on insert failure                  |
| DELETE /api/users/:id | Deletes and returns the user     | 404 if not found, 400 for invalid ID, 500 on delete failure   |

### Integration test coverage (real DB)

These tests hit the live Supabase database. The database is cleared before each test via `clearDatabase()` to guarantee a fresh state.

| Endpoint              | Happy Path                                      | Sad Path(s)                          |
| --------------------- | ----------------------------------------------- | ------------------------------------ |
| GET /api/users        | Empty list; list after inserts                  | —                                    |
| GET /api/users/:id    | Returns correct user                            | 404 not found, 400 invalid ID       |
| POST /api/users       | Persists user and verifies in DB                | 400 missing name, 400 missing age   |
| DELETE /api/users/:id | Deletes user and verifies removal               | 404 not found, 400 invalid ID       |

### How mocking works (unit tests)

Instead of hitting the real Supabase API, Jest replaces the `supabaseClient` module with a fake object:

```ts
jest.mock("../supabaseClient", () => ({
  supabase: {
    from: jest.fn(),
  },
}));
```

Each test then configures what the fake `from()` chain should return, allowing us to simulate both successful responses and database errors without any network calls.

### How integration tests work

Integration tests import a `clearDatabase()` helper that deletes all rows from the `users` table before each test:

```ts
beforeEach(async () => {
  await clearDatabase();
});
```

This ensures every test starts with an empty database, making results deterministic even when running against a live Supabase instance.

## Project Structure

```
backend-api/
├── .env.example               # Template for environment variables
├── jest.config.cjs            # Jest configuration
├── package.json
├── tsconfig.json
├── README.md
└── src/
    ├── app.ts                 # Express app definition
    ├── server.ts              # Server entry point
    ├── supabaseClient.ts      # Supabase client setup
    ├── routes/
    │   └── users.ts           # User CRUD route handlers
    └── __tests__/
        ├── users.test.ts              # Mocked unit tests
        ├── users.integration.test.ts  # Real-DB integration tests
        └── utils/
            └── db.ts                  # clearDatabase() helper
```
