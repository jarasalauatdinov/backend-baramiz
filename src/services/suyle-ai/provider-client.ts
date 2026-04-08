import OpenAI from "openai";
import { env } from "../../config/env";
import { AppError } from "../../utils/app-error";

let cachedClient: OpenAI | null | undefined;

export function isMockAiEnabled() {
  return env.USE_MOCK_AI;
}

export function getSuyleAIClient() {
  if (cachedClient !== undefined) {
    return cachedClient;
  }

  cachedClient = env.AI_PROVIDER_API_KEY
    ? new OpenAI({
        apiKey: env.AI_PROVIDER_API_KEY,
        ...(env.AI_PROVIDER_BASE_URL ? { baseURL: env.AI_PROVIDER_BASE_URL } : {}),
      })
    : null;

  return cachedClient;
}

export function requireSuyleAIClient(operation: string) {
  const client = getSuyleAIClient();

  if (!client) {
    throw new AppError(
      503,
      `Missing AI provider configuration for ${operation}. Set OPENAI_API_KEY or enable USE_MOCK_AI=true.`,
    );
  }

  return client;
}

export async function withTimeout<T>(promise: Promise<T>, message: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => reject(new AppError(504, message)), env.AI_REQUEST_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}
