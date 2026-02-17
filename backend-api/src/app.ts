import express, { Application } from "express";
import cors from "cors";
import userRoutes from "./routes/users";

const app: Application = express();

app.use(express.json());
app.use(cors());

app.use("/api/users", userRoutes);

export default app;
