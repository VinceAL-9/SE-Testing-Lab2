import request from "supertest";
import app from "../app";
import { supabase } from "../supabaseClient";

// Tell Jest to replace the supabaseClient module with a mock
jest.mock("../supabaseClient", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe("Users API - Mocked Supabase", () => {
  // ──────────────────────────────────────────────
  // GET /api/users  (fetch all)
  // ──────────────────────────────────────────────
  describe("GET /api/users", () => {
    it("should return all users (happy path)", async () => {
      const mockUsers = [
        { id: 1, name: "Alice", age: 25 },
        { id: 2, name: "Bob", age: 30 },
      ];

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue({ data: mockUsers, error: null }),
      });

      const res = await request(app).get("/api/users");

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(mockUsers);
      expect(res.body.length).toBe(2);
    });

    it("should return 500 when database fails (sad path)", async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: null,
          error: { message: "Database connection failed" },
        }),
      });

      const res = await request(app).get("/api/users");

      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe("Database connection failed");
    });
  });

  // ──────────────────────────────────────────────
  // GET /api/users/:id  (fetch one)
  // ──────────────────────────────────────────────
  describe("GET /api/users/:id", () => {
    it("should return a single user by ID (happy path)", async () => {
      const mockUser = { id: 1, name: "Alice", age: 25 };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({ data: mockUser, error: null }),
          }),
        }),
      });

      const res = await request(app).get("/api/users/1");

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(mockUser);
    });

    it("should return 404 when user does not exist (sad path)", async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      });

      const res = await request(app).get("/api/users/9999");

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe("User not found");
    });

    it("should return 400 for an invalid ID (sad path)", async () => {
      const res = await request(app).get("/api/users/abc");

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe("Invalid user ID");
    });
  });

  // ──────────────────────────────────────────────
  // POST /api/users  (create)
  // ──────────────────────────────────────────────
  describe("POST /api/users", () => {
    it("should create a new user (happy path)", async () => {
      const newUser = { name: "Charlie", age: 22 };
      const mockResponse = [{ id: 3, ...newUser }];

      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({ data: mockResponse, error: null }),
        }),
      });

      const res = await request(app).post("/api/users").send(newUser);

      expect(res.statusCode).toBe(201);
      expect(res.body).toEqual(mockResponse[0]);
      expect(res.body.name).toBe("Charlie");
    });

    it("should return 400 when name is missing (sad path)", async () => {
      const res = await request(app).post("/api/users").send({ age: 22 });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe("Name and age are required");
    });

    it("should return 400 when age is missing (sad path)", async () => {
      const res = await request(app).post("/api/users").send({ name: "Charlie" });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe("Name and age are required");
    });

    it("should return 500 when insert fails (sad path)", async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({
            data: null,
            error: { message: "Insert failed" },
          }),
        }),
      });

      const res = await request(app)
        .post("/api/users")
        .send({ name: "Charlie", age: 22 });

      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe("Insert failed");
    });
  });

  // ──────────────────────────────────────────────
  // DELETE /api/users/:id  (remove)
  // ──────────────────────────────────────────────
  describe("DELETE /api/users/:id", () => {
    it("should delete an existing user (happy path)", async () => {
      const deletedUser = { id: 1, name: "Alice", age: 25 };

      (supabase.from as jest.Mock).mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue({ data: [deletedUser], error: null }),
          }),
        }),
      });

      const res = await request(app).delete("/api/users/1");

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(deletedUser);
    });

    it("should return 404 when user does not exist (sad path)", async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      });

      const res = await request(app).delete("/api/users/9999");

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe("User not found");
    });

    it("should return 400 for an invalid ID (sad path)", async () => {
      const res = await request(app).delete("/api/users/abc");

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe("Invalid user ID");
    });

    it("should return 500 when delete fails (sad path)", async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue({
              data: null,
              error: { message: "Delete operation failed" },
            }),
          }),
        }),
      });

      const res = await request(app).delete("/api/users/1");

      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe("Delete operation failed");
    });
  });
});
