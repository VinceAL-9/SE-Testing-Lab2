import request from "supertest";
import app from "../app.ts";
import { _resetCartItems } from "../routes/cart_items";

describe("Cart API (3 endpoints)", () => {
  beforeEach(() => {
    _resetCartItems();
  });

  it("GET /api/cart_items - returns empty list (happy path)", async () => {
    const res = await request(app).get("/api/cart_items");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });

  it("POST /api/cart_items - add item (happy path) and GET /api/cart_items/:id", async () => {
    const newItem = { name: "Keyboard", price: 45 };
    const post = await request(app).post("/api/cart_items").send(newItem);
    expect(post.statusCode).toBe(201);
    expect(post.body).toMatchObject({
      id: expect.any(Number),
      name: "Keyboard",
      price: 45,
    });

    const id = post.body.id;
    const getById = await request(app).get(`/api/cart_items/${id}`);
    expect(getById.statusCode).toBe(200);
    expect(getById.body).toEqual(post.body);
  });

  it("POST /api/cart_items - missing fields (sad path)", async () => {
    const res = await request(app)
      .post("/api/cart_items")
      .send({ name: "Bad" });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it("GET /api/cart_items/:id - non existent id (sad path)", async () => {
    const res = await request(app).get("/api/cart_items/9999");
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBeDefined();
  });

  it("DELETE /api/cart_items/:id - remove item (happy) and 404 when missing (sad)", async () => {
    const newItem = { name: "Mouse", price: 10 };
    const post = await request(app).post("/api/cart_items").send(newItem);
    const id = post.body.id;

    const del = await request(app).delete(`/api/cart_items/${id}`);
    expect(del.statusCode).toBe(200);
    expect(del.body).toEqual(post.body);

    const del2 = await request(app).delete(`/api/cart_items/${id}`);
    expect(del2.statusCode).toBe(404);
  });
});
