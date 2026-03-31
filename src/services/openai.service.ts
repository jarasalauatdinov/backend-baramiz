import OpenAI from "openai";
import { z } from "zod";
import { env } from "../config/env";
import type { Language, Place, TranslationResult } from "../types/tourism.types";

const translationResponseSchema = z.object({
  name_ru: z.string().trim().min(1),
  name_en: z.string().trim().min(1),
  description_ru: z.string().trim().min(1),
  description_en: z.string().trim().min(1),
});

interface OpenAIChatRequest {
  message: string;
  language: Language;
  contextPlaces: Place[];
  instructions: string[];
}

interface OpenAITranslationRequest {
  nameUz: string;
  descriptionUz: string;
}

class OpenAIService {
  private readonly client: OpenAI | null;
  private readonly model: string;

  constructor() {
    this.client = env.OPENAI_API_KEY ? new OpenAI({ apiKey: env.OPENAI_API_KEY }) : null;
    this.model = env.OPENAI_MODEL ?? "gpt-4.1-mini";
  }

  isEnabled(): boolean {
    return Boolean(this.client);
  }

  async createChatReply(request: OpenAIChatRequest): Promise<string | null> {
    if (!this.client) {
      return null;
    }

    const compactContext = request.contextPlaces
      .slice(0, 6)
      .map((place) => {
        return `- ${place.name} | ${place.city} | ${place.category} | ${place.durationMinutes} min | ${place.description}`;
      })
      .join("\n");

    const promptInstructions = request.instructions.map((instruction) => `- ${instruction}`).join("\n");

    const response = await this.client.responses.create({
      model: this.model,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: [
                "You are Baramiz AI, a helpful travel assistant for Karakalpakstan.",
                "Use the supplied local place data first.",
                "Reply in the requested language.",
                "Do not invent places outside the provided context unless giving a brief general travel tip.",
                "Keep the answer concise and tourism-focused.",
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
                `Local tourism context:\n${compactContext}`,
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
  }

  async translatePlaceFromUz(request: OpenAITranslationRequest): Promise<TranslationResult | null> {
    if (!this.client) {
      return null;
    }

    const response = await this.client.responses.create({
      model: this.model,
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
                `name_uz: ${request.nameUz}`,
                `description_uz: ${request.descriptionUz}`,
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
  }
}

export const openAIService = new OpenAIService();
