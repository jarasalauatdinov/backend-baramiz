import OpenAI from "openai";
import { z } from "zod";
import { env } from "../config/env";
import type { Language, Place, PublicServiceItem, TourProduct, TranslationResponse } from "../types/tourism.types";

const translationResponseSchema = z.object({
  name_ru: z.string().trim().min(1),
  name_en: z.string().trim().min(1),
  description_ru: z.string().trim().min(1),
  description_en: z.string().trim().min(1),
});

interface ChatProviderRequest {
  message: string;
  language: Language;
  context: {
    places: Place[];
    services: PublicServiceItem[];
    tours: TourProduct[];
  };
  instructions: string[];
}

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

const toProviderError = (operation: "chat" | "translation", error: unknown): Error => {
  if (error instanceof Error) {
    return new Error(`${env.AI_PROVIDER_MODE} ${operation} request failed: ${error.message}`);
  }

  return new Error(`${env.AI_PROVIDER_MODE} ${operation} request failed`);
};

export const isAiProviderEnabled = (): boolean => {
  return Boolean(getClient());
};

export const createAiChatReply = async (request: ChatProviderRequest): Promise<string | null> => {
  const client = getClient();

  if (!client) {
    return null;
  }

  const compactPlaces = request.context.places
    .slice(0, 6)
    .map((place) => {
      return `- ${place.name} | city: ${place.city} | category: ${place.category} | duration: ${place.duration} min | ${place.shortDescription}`;
    })
    .join("\n");
  const compactServices = request.context.services
    .slice(0, 4)
    .map((service) => {
      return `- ${service.title} | section: ${service.sectionSlug} | city: ${service.city ?? "unknown"} | serviceType: ${service.serviceType ?? "general"} | address: ${service.address ?? "n/a"}`;
    })
    .join("\n");
  const compactTours = request.context.tours
    .slice(0, 3)
    .map((tour) => {
      return `- ${tour.title} | city: ${tour.city} | duration: ${tour.durationLabel} | type: ${tour.type} | summary: ${tour.shortDescription} | stops: ${tour.stops.map((stop) => stop.name).join(", ")}`;
    })
    .join("\n");

  const promptInstructions = request.instructions.map((instruction) => `- ${instruction}`).join("\n");

  try {
    const response = await client.responses.create({
      model: env.AI_PROVIDER_MODEL,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: [
                "You are Baramiz AI, a helpful travel assistant for Karakalpakstan.",
                "Use the supplied local place, service, and tour data first.",
                "Reply in the requested language.",
                "Do not invent places, services, or tours outside the provided context unless giving one brief general travel tip.",
                "Keep the answer concise, practical, and tourism-focused.",
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
                `Language: ${request.language}`,
                `Prompt instructions:\n${promptInstructions}`,
                `User question: ${request.message}`,
                `Local places:\n${compactPlaces || "- none"}`,
                `Local services:\n${compactServices || "- none"}`,
                `Tour ideas:\n${compactTours || "- none"}`,
              ].join("\n\n"),
            },
          ],
        },
      ],
    });

    const outputText = response.output_text;

    return typeof outputText === "string" && outputText.trim().length > 0
      ? outputText.trim()
      : null;
  } catch (error) {
    throw toProviderError("chat", error);
  }
};

export const translatePlaceWithAi = async (
  nameUz: string,
  descriptionUz: string,
): Promise<TranslationResponse | null> => {
  const client = getClient();

  if (!client) {
    return null;
  }

  try {
    const response = await client.responses.create({
      model: env.AI_PROVIDER_MODEL,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: [
                "You translate tourism content from Uzbek into Russian and English.",
                "Return only valid JSON.",
                "Do not use markdown or code fences.",
                "Keep place names natural and concise.",
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
                "Translate this place content from Uzbek.",
                "Return exactly these keys: name_ru, name_en, description_ru, description_en.",
                `name_uz: ${nameUz}`,
                `description_uz: ${descriptionUz}`,
              ].join("\n"),
            },
          ],
        },
      ],
    });

    const rawOutput = response.output_text;

    if (typeof rawOutput !== "string" || rawOutput.trim().length === 0) {
      return null;
    }

    const cleanedOutput = rawOutput
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    try {
      const parsedOutput = JSON.parse(cleanedOutput);
      return translationResponseSchema.parse(parsedOutput);
    } catch {
      return null;
    }
  } catch (error) {
    throw toProviderError("translation", error);
  }
};
