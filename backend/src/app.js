import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { apiRoutes } from "./routes/index.js";
import { errorHandler } from "./middleware/error.js";

export const app = express();

app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
  }),
);
app.use(express.json());

app.use("/api", apiRoutes);

app.use(errorHandler);
