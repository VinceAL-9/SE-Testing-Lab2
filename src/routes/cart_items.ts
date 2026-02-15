import { Router, Request, Response } from "express";

interface Item {
  id: number;
  name: string;
  price: number;
}

const router = Router();

let items: Item[] = [];
let nextId = 1;

router.get("/", (req: Request, res: Response) => {
  res.status(200).json(items);
});

router.get("/:id", (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const item = items.find((i) => i.id === id);
  if (!item) return res.status(404).json({ error: "Item not found" });
  res.status(200).json(item);
});

router.post("/", (req: Request, res: Response) => {
  const { name, price } = req.body as Partial<Item>;
  if (!name || price === undefined) {
    return res.status(400).json({ error: "Name and price are required" });
  }

  const newItem: Item = { id: nextId++, name, price } as Item;
  items.push(newItem);
  res.status(201).json(newItem);
});

router.delete("/:id", (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) return res.status(404).json({ error: "Item not found" });
  const removed = items.splice(idx, 1)[0];
  res.status(200).json(removed);
});

export function _resetCartItems(): void {
  items = [];
  nextId = 1;
}

export default router;
