
SE 2240 Lab 2 (done in pairs)
Deadline: Feb 17, 11:59pm
For this Laboratory, you will be implementing API testing. You can use a previous project that uses React/NextJS or a different tech stack altogether. If you don’t have any projects, then you can use sample projects over at Github.

Requirements:
Install supertest and jest. (You can use any other alternatives)
Create API tests for at least 3 API endpoints.
There should be at least one happy path API test for each endpoint.
There should be at least one sad path test cases for each endpoint.
A reasonable readme.md for the instructions.

"" THE CART IS ONLY AN EXAMPLE, READ MY CODE AND IMPLEMENT ITS OWN ""
Here is the updated step-by-step guide replacing the in-memory array with **Supabase** (a PostgreSQL-based platform).

This guide involves three distinct layers:

1. **The Code:** Your Express app talking to Supabase.
2. **The Environment:** Handling API keys securely.
3. **The Tests:** Mocking Supabase so your tests run instantly without needing a real internet connection.

### **Phase 1: Project & Supabase Setup**

**1. Initialize and Install**
We need the same base packages, plus `dotenv` (for API keys) and the `supabase-js` client.

```bash
mkdir shopping-api-supabase
cd shopping-api-supabase
npm init -y

# Production dependencies
npm install express cors dotenv @supabase/supabase-js

# Development dependencies
npm install -D typescript ts-node nodemon jest supertest ts-jest @types/node @types/express @types/cors @types/jest @types/supertest

```

**2. Configure TypeScript**
Run `npx tsc --init` and update `tsconfig.json` to ensure your code compiles correctly:

```json
{
  "compilerOptions": {
    "target": "es2020",
    "module": "commonjs",
    "rootDir": "./src",
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "**/*.test.ts"]
}

```

**3. Set up the Supabase Database**

* Go to [supabase.com](https://supabase.com) and create a new project.
* Go to the **Table Editor** and create a new table named `cart_items`.
* Add the following columns:
* `id` (int8, Primary Key, Identity)
* `name` (text)
* `price` (float8)



**4. Environment Variables**
Create a `.env` file in your root folder. **Never commit this file to Git.**

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_KEY=your-anon-public-key
PORT=3000

```

---

### **Phase 2: Building the Application**

**1. Create the Supabase Client (`src/supabaseClient.ts`)**
This single file manages your connection.

```typescript
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

```

**2. Create the Application Entry (`src/app.ts`)**
Same as before, we separate the app definition from the listener.

```typescript
import express, { Application } from 'express';
import cors from 'cors';
import cartRoutes from './routes/cart';

const app: Application = express();

app.use(express.json());
app.use(cors());

app.use('/api/cart', cartRoutes);

export default app;

```

**3. Create the Routes (`src/routes/cart.ts`)**
Here we replace the array logic with async Supabase calls.

```typescript
import { Router, Request, Response } from 'express';
import { supabase } from '../supabaseClient';

const router = Router();

// GET /api/cart - Fetch from Supabase
router.get('/', async (req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('cart_items')
    .select('*');

  if (error) {
    res.status(500).json({ error: error.message });
    return
  }
  
  res.status(200).json(data);
});

// POST /api/cart - Insert into Supabase
router.post('/', async (req: Request, res: Response) => {
  const { name, price } = req.body;

  if (!name || !price) {
    res.status(400).json({ error: "Name and price are required" });
    return 
  }

  // .select() at the end returns the inserted row immediately
  const { data, error } = await supabase
    .from('cart_items')
    .insert([{ name, price }])
    .select();

  if (error) {
    res.status(500).json({ error: error.message });
    return
  }

  res.status(201).json(data[0]);
});

export default router;

```

**4. Server Startup (`src/server.ts`)**

```typescript
import app from './app';
import dotenv from 'dotenv';

dotenv.config();
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

```

---

### **Phase 3: The Mock Testing Strategy**

Testing against a real cloud database is slow, flaky, and requires managing test data cleanup. Instead, we will **Mock** the Supabase client.

**Concept: Jest Mocks**
We will tell Jest: *"Whenever `src/routes/cart.ts` tries to import `supabaseClient`, give it this fake object instead."*

**1. Configure Jest (`jest.config.js`)**

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  clearMocks: true,
};

```

**2. Write the Mocked Test (`src/__tests__/cart.test.ts`)**

```typescript
import request from 'supertest';
import app from '../app';

// 1. Import the real client so we can mock it
import { supabase } from '../supabaseClient';

// 2. Tell Jest to mock the module
jest.mock('../supabaseClient', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('Shopping Cart API (Supabase)', () => {
  
  it('should fetch all items', async () => {
    // A. Define the fake data we want Supabase to return
    const mockData = [{ id: 1, name: 'Laptop', price: 999 }];
    
    // B. Mock the chain: supabase.from().select()
    // We use mockReturnValue to simulate the chained methods
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue({ data: mockData, error: null }),
    });

    // C. Run the request
    const res = await request(app).get('/api/cart');

    // D. Assertions
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual(mockData);
  });

  it('should add a new item', async () => {
    const newItem = { name: 'Mouse', price: 20 };
    const mockResponse = [{ id: 2, ...newItem }];

    // Mock the chain: supabase.from().insert().select()
    (supabase.from as jest.Mock).mockReturnValue({
      insert: jest.fn().mockReturnThis(), // Returns "this" so we can chain .select()
      select: jest.fn().mockResolvedValue({ data: mockResponse, error: null }),
    });

    const res = await request(app).post('/api/cart').send(newItem);

    expect(res.statusCode).toEqual(201);
    expect(res.body).toEqual(mockResponse[0]);
  });

  it('should handle Supabase errors gracefully', async () => {
    // Simulate a database failure
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue({ 
        data: null, 
        error: { message: "Database connection failed" } 
      }),
    });

    const res = await request(app).get('/api/cart');

    expect(res.statusCode).toEqual(500);
    expect(res.body.error).toEqual("Database connection failed");
  });
});

```

### **Phase 4: Run the Verification**

Add the test script to `package.json` and run:

```bash
npm test

```

### **Why this matters**

By mocking Supabase, you have achieved **Unit Isolation**.

1. **Speed:** Tests run in milliseconds because they never hit the internet.
2. **Safety:** You can't accidentally delete production data during a test.
3. **Reliability:** Your tests won't fail just because your WiFi is down.

For a deeper dive into how to cleanly separate your database logic from your API logic to make testing even easier, I recommend watching this breakdown.

[TypeScript Backend Architecture - Services & Controllers](https://www.youtube.com/watch?v=0LhBvp8qpro)

This video is relevant because it demonstrates the "Service Layer" pattern, which is the professional standard for keeping your database queries (Supabase calls) separate from your Express routes.