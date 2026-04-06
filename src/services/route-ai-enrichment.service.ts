import OpenAI from "openai";
import { z } from "zod";
import { env } from "../config/env";
import type { CategoryId, GeneratedRoute, Language } from "../types/tourism.types";
import { getCategoryLabel } from "../utils/text-helpers";

interface RouteAiEnrichmentInput {
  resolvedCity: string;
  language: Language;
  interests: CategoryId[];
  generatedRoute: GeneratedRoute;
}

export interface RoutePresentationEnrichment {
  title: string;
  summary: string;
  tips: string[];
}

const ROUTE_AI_ENRICHMENT_TIMEOUT_MS = 6000;

const routeAiEnrichmentSchema = z.object({
  title: z.string().trim().min(1).max(120),
  summary: z.string().trim().min(1).max(240),
  tips: z.array(z.string().trim().min(1).max(140)).min(2).max(4),
});

let cachedClient: OpenAI | null | undefined;

const getClient = (): OpenAI | null => {
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
};

const withTimeout = async <T>(operation: Promise<T>, timeoutMs: number): Promise<T> => {
  let timeoutId: NodeJS.Timeout | undefined;

  try {
    return await Promise.race([
      operation,
      new Promise<T>((_resolve, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`timed out after ${timeoutMs} ms`));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

const toProviderError = (error: unknown): Error => {
  if (error instanceof Error) {
    return new Error(`${env.AI_PROVIDER_MODE} route enrichment request failed: ${error.message}`);
  }

  return new Error(`${env.AI_PROVIDER_MODE} route enrichment request failed`);
};

const routeEnrichmentJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "summary", "tips"],
  properties: {
    title: {
      type: "string",
      minLength: 1,
      maxLength: 120,
    },
    summary: {
      type: "string",
      minLength: 1,
      maxLength: 240,
    },
    tips: {
      type: "array",
      minItems: 2,
      maxItems: 4,
      items: {
        type: "string",
        minLength: 1,
        maxLength: 140,
      },
    },
  },
} as const;

const parseRouteEnrichmentOutput = (rawOutput: string): RoutePresentationEnrichment => {
  const cleanedOutput = rawOutput
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const parsedOutput = JSON.parse(cleanedOutput);
  const parsedEnrichment = routeAiEnrichmentSchema.parse(parsedOutput);
  const uniqueTips = Array.from(new Set(parsedEnrichment.tips.map((tip) => tip.trim()).filter(Boolean)));

  if (uniqueTips.length < 2) {
    throw new Error("route enrichment returned fewer than 2 unique tips");
  }

  return {
    title: parsedEnrichment.title.trim(),
    summary: parsedEnrichment.summary.trim(),
    tips: uniqueTips,
  };
};

export const enrichRouteWithAi = async (
  input: RouteAiEnrichmentInput,
): Promise<RoutePresentationEnrichment | null> => {
  const client = getClient();

  if (!client) {
    return null;
  }

  const localizedInterests = input.interests.length > 0
    ? input.interests.map((interest) => getCategoryLabel(interest, input.language)).join(", ")
    : "auto-selected city highlights";
  const compactStops = input.generatedRoute.stops
    .map((stop) => {
      return `- ${stop.order}. ${stop.name} | city: ${stop.city} | category: ${stop.category} | duration: ${stop.estimatedDurationMinutes} min | reason: ${stop.description}`;
    })
    .join("\n");

  try {
    const response = await withTimeout(
      client.responses.create({
        model: env.AI_PROVIDER_MODEL,
        text: {
          format: {
            type: "json_schema",
            name: "route_enrichment",
            description: "Grounded route presentation for Baramiz route cards",
            schema: routeEnrichmentJsonSchema,
            strict: true,
          },
        },
        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text: [
                  "You enrich a pre-planned Baramiz travel route for Karakalpakstan.",
                  "Do not choose stops. Do not remove stops. Do not invent stops, cities, or activities.",
                  "Use only the provided city and stop names.",
                  "Reply in the requested language.",
                  "Keep the title concise, the summary practical, and the tips short.",
                  "Return only valid JSON matching the requested schema.",
                ].join(" "),
              },
            ],
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: [
                  `Language: ${input.language}`,
                  `City: ${input.resolvedCity}`,
                  `Duration: ${input.generatedRoute.duration}`,
                  `Interests: ${localizedInterests}`,
                  `Total duration minutes: ${input.generatedRoute.totalDurationMinutes}`,
                  `Current deterministic title: ${input.generatedRoute.title}`,
                  `Current deterministic summary: ${input.generatedRoute.summary}`,
                  `Allowed stop names: ${input.generatedRoute.stops.map((stop) => stop.name).join(", ")}`,
                  `Stops:\n${compactStops}`,
                  "Generate a stronger but grounded title, summary, and 2 to 4 practical tips.",
                ].join("\n\n"),
              },
            ],
          },
        ],
      }),
      ROUTE_AI_ENRICHMENT_TIMEOUT_MS,
    );

    const rawOutput = response.output_text;

    if (typeof rawOutput !== "string" || rawOutput.trim().length === 0) {
      throw new Error("route enrichment returned empty output");
    }

    return parseRouteEnrichmentOutput(rawOutput);
  } catch (error) {
    throw toProviderError(error);
  }
};
