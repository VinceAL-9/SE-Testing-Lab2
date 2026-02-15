import express, { Express } from "express";
import cors from "cors";
import cartRoutes from "./routes/cart_items";

const app: Express = express();

app.use(express.json());
app.use(cors());

app.use("/api/cart_items", cartRoutes);

export default app;
