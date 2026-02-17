import request from "supertest";
import app from "../app";
import { clearDatabase } from "./utils/db";

describe("Users API Integration Tests (real DB)", () => {
  // Wipe the DB before each test so every test starts fresh
    beforeEach(async () => {
        await clearDatabase();
    });

    afterAll(async () => {
        await clearDatabase();
    });

  // ──────────────────────────────────────────────
  // GET /api/users
  // ──────────────────────────────────────────────
  describe("GET /api/users", () => {
    it("should return an empty list when no users exist (happy path)", async () => {
      const res = await request(app).get("/api/users");

      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toEqual(true);
      expect(res.body.length).toEqual(0);
    });

    it("should return all users after inserting (happy path)", async () => {
      // Seed two users
      await request(app).post("/api/users").send({ name: "Alice", age: 25 });
      await request(app).post("/api/users").send({ name: "Bob", age: 30 });

      const res = await request(app).get("/api/users");

      expect(res.statusCode).toEqual(200);
      expect(res.body.length).toEqual(2);
    });
  });

  // ──────────────────────────────────────────────
  // GET /api/users/:id
  // ──────────────────────────────────────────────
  describe("GET /api/users/:id", () => {
    it("should return a single user by ID (happy path)", async () => {
      const post = await request(app)
        .post("/api/users")
        .send({ name: "Charlie", age: 22 });
      const id = post.body.id;

      const res = await request(app).get(`/api/users/${id}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.name).toEqual("Charlie");
      expect(res.body.age).toEqual(22);
    });

    it("should return 404 for a non-existent user (sad path)", async () => {
      const res = await request(app).get("/api/users/999999");

      expect(res.statusCode).toEqual(404);
      expect(res.body.error).toEqual("User not found");
    });

    it("should return 400 for an invalid ID (sad path)", async () => {
      const res = await request(app).get("/api/users/abc");

      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toEqual("Invalid user ID");
    });
  });

  // ──────────────────────────────────────────────
  // POST /api/users
  // ──────────────────────────────────────────────
  describe("POST /api/users", () => {
    it("should save a user to the database (happy path)", async () => {
      const newUser = { name: "Diana", age: 28 };

      const res = await request(app).post("/api/users").send(newUser);

      expect(res.statusCode).toEqual(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.name).toEqual("Diana");
      expect(res.body.age).toEqual(28);

      // Verify it actually persisted
      const dbCheck = await request(app).get("/api/users");
      expect(dbCheck.body.length).toEqual(1);
      expect(dbCheck.body[0].name).toEqual("Diana");
    });

    it("should return 400 when name is missing (sad path)", async () => {
      const res = await request(app).post("/api/users").send({ age: 22 });

      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toEqual("Name and age are required");
    });

    it("should return 400 when age is missing (sad path)", async () => {
      const res = await request(app).post("/api/users").send({ name: "Eve" });

      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toEqual("Name and age are required");
    });
  });

  // ──────────────────────────────────────────────
  // DELETE /api/users/:id
  // ──────────────────────────────────────────────
  describe("DELETE /api/users/:id", () => {
    it("should delete a user from the database (happy path)", async () => {
      const post = await request(app)
        .post("/api/users")
        .send({ name: "Frank", age: 35 });
      const id = post.body.id;

      const del = await request(app).delete(`/api/users/${id}`);

      expect(del.statusCode).toEqual(200);
      expect(del.body.name).toEqual("Frank");

      // Verify it's actually gone
      const dbCheck = await request(app).get(`/api/users/${id}`);
      expect(dbCheck.statusCode).toEqual(404);
    });

    it("should return 404 when deleting a non-existent user (sad path)", async () => {
      const res = await request(app).delete("/api/users/999999");

      expect(res.statusCode).toEqual(404);
      expect(res.body.error).toEqual("User not found");
    });

    it("should return 400 for an invalid ID (sad path)", async () => {
      const res = await request(app).delete("/api/users/abc");

      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toEqual("Invalid user ID");
    });
  });
});
