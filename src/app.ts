import path from "node:path";
import cors, { type CorsOptions } from "cors";
import express from "express";
import { env } from "./config/env";
import apiRouter from "./routes";
import { errorHandlerMiddleware } from "./middleware/error-handler.middleware";
import { notFoundMiddleware } from "./middleware/not-found.middleware";

const app = express();
const allowedOrigins = new Set(env.CORS_ALLOWED_ORIGINS);
const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }

    callback(null, allowedOrigins.has(origin));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
};
const assetsDirectoryPath = path.join(process.cwd(), "public", "assets");

app.set("trust proxy", 1);
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(
  "/assets",
  express.static(assetsDirectoryPath, {
    maxAge: env.NODE_ENV === "production" ? "7d" : 0,
    etag: true,
  }),
);
app.use(express.json());
app.use("/api", apiRouter);
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

export default app;
