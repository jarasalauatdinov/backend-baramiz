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

const parseBoolean = (value: unknown): unknown => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value !== "string") {
    return value;
  }

  const normalizedValue = value.trim().toLowerCase();

  if (["true", "1", "yes", "on"].includes(normalizedValue)) {
    return true;
  }

  if (["false", "0", "no", "off"].includes(normalizedValue)) {
    return false;
  }

  return value;
};

const normalizeOrigin = (value: string): string => new URL(value).origin;
const normalizeUrl = (value: string): string => value.replace(/\/+$/, "");
const normalizeOriginCandidate = (value: string): string | undefined => {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return undefined;
  }

  try {
    return normalizeOrigin(trimmedValue);
  } catch {
    return undefined;
  }
};

const parseOriginList = (value: unknown): string[] | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const origins = value
    .split(",")
    .map(normalizeOriginCandidate)
    .filter((item): item is string => Boolean(item));

  return origins.length > 0 ? Array.from(new Set(origins)) : undefined;
};

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  FRONTEND_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
  CORS_ALLOWED_ORIGINS: z.preprocess(parseOriginList, z.array(z.string().url()).default([])),
  PUBLIC_BASE_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
  AUTH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
  USE_MOCK_AI: z.preprocess(parseBoolean, z.boolean().default(false)),
  AI_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(15000),
  TAHRIRCHI_API_KEY: z.preprocess(emptyToUndefined, z.string().optional()),
  TAHRIRCHI_TRANSLATE_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
  TAHRIRCHI_MODEL: z.preprocess(emptyToUndefined, z.string().optional()),
  PROVIDER_API_KEY: z.preprocess(emptyToUndefined, z.string().optional()),
  PROVIDER_MODEL: z.preprocess(emptyToUndefined, z.string().optional()),
  PROVIDER_BASE_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
  OPENAI_API_KEY: z.preprocess(emptyToUndefined, z.string().optional()),
  OPENAI_MODEL: z.preprocess(emptyToUndefined, z.string().optional()),
  OPENAI_BASE_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
  ANOTHER_PROVIDER_KEY: z.preprocess(emptyToUndefined, z.string().optional()),
  SUYLE_AI_TRANSLATION_MODEL: z.preprocess(emptyToUndefined, z.string().optional()),
  SUYLE_AI_STT_MODEL: z.preprocess(emptyToUndefined, z.string().optional()),
  SUYLE_AI_TTS_MODEL: z.preprocess(emptyToUndefined, z.string().optional()),
});

const parsedEnv = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT ?? "5000",
  FRONTEND_URL: process.env.FRONTEND_URL,
  CORS_ALLOWED_ORIGINS: process.env.CORS_ALLOWED_ORIGINS,
  PUBLIC_BASE_URL: process.env.PUBLIC_BASE_URL,
  AUTH_TOKEN_TTL_DAYS: process.env.AUTH_TOKEN_TTL_DAYS ?? "30",
  USE_MOCK_AI: process.env.USE_MOCK_AI ?? "false",
  AI_REQUEST_TIMEOUT_MS: process.env.AI_REQUEST_TIMEOUT_MS ?? "15000",
  TAHRIRCHI_API_KEY: process.env.TAHRIRCHI_API_KEY,
  TAHRIRCHI_TRANSLATE_URL: process.env.TAHRIRCHI_TRANSLATE_URL,
  TAHRIRCHI_MODEL: process.env.TAHRIRCHI_MODEL,
  PROVIDER_API_KEY: process.env.PROVIDER_API_KEY,
  PROVIDER_MODEL: process.env.PROVIDER_MODEL,
  PROVIDER_BASE_URL: process.env.PROVIDER_BASE_URL,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_MODEL: process.env.OPENAI_MODEL,
  OPENAI_BASE_URL: process.env.OPENAI_BASE_URL,
  ANOTHER_PROVIDER_KEY: process.env.ANOTHER_PROVIDER_KEY,
  SUYLE_AI_TRANSLATION_MODEL: process.env.SUYLE_AI_TRANSLATION_MODEL,
  SUYLE_AI_STT_MODEL: process.env.SUYLE_AI_STT_MODEL,
  SUYLE_AI_TTS_MODEL: process.env.SUYLE_AI_TTS_MODEL,
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
  ...(parsedEnv.FRONTEND_URL ? [normalizeOrigin(parsedEnv.FRONTEND_URL)] : []),
  ...parsedEnv.CORS_ALLOWED_ORIGINS,
]);

export const env = {
  ...parsedEnv,
  CORS_ALLOWED_ORIGINS: Array.from(allowedOriginsSet),
  PUBLIC_BASE_URL: parsedEnv.PUBLIC_BASE_URL ? normalizeOrigin(parsedEnv.PUBLIC_BASE_URL) : undefined,
  USE_MOCK_AI: parsedEnv.USE_MOCK_AI,
  AI_REQUEST_TIMEOUT_MS: parsedEnv.AI_REQUEST_TIMEOUT_MS,
  TAHRIRCHI_API_KEY: parsedEnv.TAHRIRCHI_API_KEY,
  TAHRIRCHI_TRANSLATE_URL: parsedEnv.TAHRIRCHI_TRANSLATE_URL
    ? normalizeUrl(parsedEnv.TAHRIRCHI_TRANSLATE_URL)
    : "https://websocket.tahrirchi.uz/translate-v2",
  TAHRIRCHI_MODEL: parsedEnv.TAHRIRCHI_MODEL ?? "sayqalchi",
  AI_PROVIDER_API_KEY: parsedEnv.PROVIDER_API_KEY ?? parsedEnv.OPENAI_API_KEY,
  AI_PROVIDER_MODEL: parsedEnv.PROVIDER_MODEL ?? parsedEnv.OPENAI_MODEL ?? "gpt-4.1-mini",
  AI_PROVIDER_BASE_URL: parsedEnv.PROVIDER_BASE_URL
    ? normalizeUrl(parsedEnv.PROVIDER_BASE_URL)
    : parsedEnv.OPENAI_BASE_URL
      ? normalizeUrl(parsedEnv.OPENAI_BASE_URL)
      : undefined,
  SUYLE_AI_TRANSLATION_MODEL: parsedEnv.SUYLE_AI_TRANSLATION_MODEL ?? parsedEnv.PROVIDER_MODEL ?? parsedEnv.OPENAI_MODEL ?? "gpt-4.1-mini",
  SUYLE_AI_STT_MODEL: parsedEnv.SUYLE_AI_STT_MODEL ?? "gpt-4o-mini-transcribe",
  SUYLE_AI_TTS_MODEL: parsedEnv.SUYLE_AI_TTS_MODEL ?? "gpt-4o-mini-tts",
  ANOTHER_PROVIDER_KEY: parsedEnv.ANOTHER_PROVIDER_KEY,
  AI_PROVIDER_MODE: parsedEnv.PROVIDER_API_KEY || parsedEnv.PROVIDER_BASE_URL || parsedEnv.OPENAI_BASE_URL
    ? "provider"
    : "openai",
} as const;

export const getAllowedOrigins = (): string[] => [...env.CORS_ALLOWED_ORIGINS];
export const isAllowedOrigin = (origin: string): boolean => {
  const normalizedOrigin = normalizeOriginCandidate(origin);
  return normalizedOrigin ? allowedOriginsSet.has(normalizedOrigin) : false;
};
export const getNormalizedOrigin = (origin: string): string => {
  return normalizeOriginCandidate(origin) ?? origin.trim().replace(/\/+$/, "");
};
