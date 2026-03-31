import type { TranslationResult } from "../types/tourism.types";
import { AppError } from "../utils/app-error";
import { openAIService } from "./openai.service";

class TranslationService {
  async translatePlaceFromUz(nameUz: string, descriptionUz: string): Promise<TranslationResult> {
    if (!openAIService.isEnabled()) {
      throw new AppError(
        503,
        "Auto-translation is not configured. Add OPENAI_API_KEY or save ru/en content manually.",
      );
    }

    try {
      const translatedContent = await openAIService.translatePlaceFromUz({
        nameUz,
        descriptionUz,
      });

      if (!translatedContent) {
        throw new Error("Empty translation response");
      }

      return translatedContent;
    } catch {
      throw new AppError(
        502,
        "Auto-translation failed. Please try again or save ru/en content manually.",
      );
    }
  }
}

export const translationService = new TranslationService();
