import path from "node:path";
import cors, { type CorsOptions } from "cors";
import express from "express";
import { env, getNormalizedOrigin, isAllowedOrigin } from "./config/env";
import { AppError } from "./utils/app-error";
import apiRouter from "./routes";
import { errorHandlerMiddleware } from "./middleware/error-handler.middleware";
import { notFoundMiddleware } from "./middleware/not-found.middleware";

const app = express();

const createCorsOptions = (): CorsOptions => ({
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }

    const normalizedOrigin = getNormalizedOrigin(origin);

    if (isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(new AppError(403, `Origin "${normalizedOrigin}" is not allowed by CORS`));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  optionsSuccessStatus: 204,
  maxAge: 60 * 60 * 12,
});

const corsOptions = createCorsOptions();
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
