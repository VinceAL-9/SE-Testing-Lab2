import { Router, Request, Response } from "express";
import { supabase } from "../supabaseClient";

const router = Router();

// GET /api/users - Fetch all users from Supabase
router.get("/", async (req: Request, res: Response) => {
  const { data, error } = await supabase.from("users").select("*");

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(200).json(data);
});

// GET /api/users/:id - Fetch a single user by ID
router.get("/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  if (!data) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.status(200).json(data);
});

// POST /api/users - Insert a new user into Supabase
router.post("/", async (req: Request, res: Response) => {
  const { name, age } = req.body;

  if (!name || age === undefined) {
    res.status(400).json({ error: "Name and age are required" });
    return;
  }

  const { data, error } = await supabase
    .from("users")
    .insert([{ name, age }])
    .select();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(201).json(data![0]);
});

// DELETE /api/users/:id - Delete a user from Supabase
router.delete("/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }

  const { data, error } = await supabase
    .from("users")
    .delete()
    .eq("id", id)
    .select();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  if (!data || data.length === 0) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.status(200).json(data[0]);
});

export default router;
