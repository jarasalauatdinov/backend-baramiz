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
const normalizeUrl = (value: string): string => value.replace(/\/+$/, "");

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
  PROVIDER_API_KEY: z.preprocess(emptyToUndefined, z.string().optional()),
  PROVIDER_MODEL: z.preprocess(emptyToUndefined, z.string().optional()),
  PROVIDER_BASE_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
  OPENAI_API_KEY: z.preprocess(emptyToUndefined, z.string().optional()),
  OPENAI_MODEL: z.preprocess(emptyToUndefined, z.string().optional()),
  OPENAI_BASE_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
});

const parsedEnv = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT ?? "3000",
  FRONTEND_URL: process.env.FRONTEND_URL,
  CORS_ALLOWED_ORIGINS: process.env.CORS_ALLOWED_ORIGINS,
  PUBLIC_BASE_URL: process.env.PUBLIC_BASE_URL,
  PROVIDER_API_KEY: process.env.PROVIDER_API_KEY,
  PROVIDER_MODEL: process.env.PROVIDER_MODEL,
  PROVIDER_BASE_URL: process.env.PROVIDER_BASE_URL,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_MODEL: process.env.OPENAI_MODEL,
  OPENAI_BASE_URL: process.env.OPENAI_BASE_URL,
});

const defaultDevelopmentOrigins = parsedEnv.NODE_ENV === "production"
  ? []
  : [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "http://localhost:5176",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:5174",
      "http://127.0.0.1:5175",
      "http://127.0.0.1:5176",
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
  AI_PROVIDER_API_KEY: parsedEnv.PROVIDER_API_KEY ?? parsedEnv.OPENAI_API_KEY,
  AI_PROVIDER_MODEL: parsedEnv.PROVIDER_MODEL ?? parsedEnv.OPENAI_MODEL ?? "gpt-4.1-mini",
  AI_PROVIDER_BASE_URL: parsedEnv.PROVIDER_BASE_URL
    ? normalizeUrl(parsedEnv.PROVIDER_BASE_URL)
    : parsedEnv.OPENAI_BASE_URL
      ? normalizeUrl(parsedEnv.OPENAI_BASE_URL)
      : undefined,
  AI_PROVIDER_MODE: parsedEnv.PROVIDER_API_KEY || parsedEnv.PROVIDER_BASE_URL || parsedEnv.OPENAI_BASE_URL
    ? "provider"
    : "openai",
} as const;
