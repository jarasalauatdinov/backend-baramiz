import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const emptyToUndefined = (value: unknown): unknown => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : undefined;
};

const normalizeOrigin = (value: string): string => new URL(value).origin;

const parseOriginList = (value: unknown): string[] | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const origins = value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  return origins.length > 0 ? origins : undefined;
};

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  FRONTEND_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
  CORS_ALLOWED_ORIGINS: z.preprocess(
    parseOriginList,
    z.array(z.string().url()).default([]),
  ),
  PUBLIC_BASE_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
  OPENAI_API_KEY: z.preprocess(emptyToUndefined, z.string().optional()),
  OPENAI_MODEL: z.preprocess(emptyToUndefined, z.string().optional()),
});

const parsedEnv = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT ?? "3000",
  FRONTEND_URL: process.env.FRONTEND_URL,
  CORS_ALLOWED_ORIGINS: process.env.CORS_ALLOWED_ORIGINS,
  PUBLIC_BASE_URL: process.env.PUBLIC_BASE_URL,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_MODEL: process.env.OPENAI_MODEL,
});

const defaultDevelopmentOrigins = parsedEnv.NODE_ENV === "production"
  ? []
  : [
      "http://localhost:5176",
      "http://localhost:5173",
    ];

const allowedOriginsSet = new Set<string>([
  ...defaultDevelopmentOrigins,
  ...(parsedEnv.FRONTEND_URL ? [parsedEnv.FRONTEND_URL] : []),
  ...parsedEnv.CORS_ALLOWED_ORIGINS,
].map(normalizeOrigin));

export const env = {
  ...parsedEnv,
  CORS_ALLOWED_ORIGINS: Array.from(allowedOriginsSet),
  PUBLIC_BASE_URL: parsedEnv.PUBLIC_BASE_URL
    ? normalizeOrigin(parsedEnv.PUBLIC_BASE_URL)
    : undefined,
} as const;
