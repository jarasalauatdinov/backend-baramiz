import type { TranslationResponse } from "../types/tourism.types";
import { AppError } from "../utils/app-error";
import { isAiProviderEnabled, translatePlaceWithAi } from "./ai-provider.service";

export const translatePlaceFromUz = async (
  nameUz: string,
  descriptionUz: string,
): Promise<TranslationResponse> => {
  if (!isAiProviderEnabled()) {
    throw new AppError(
      503,
      "Auto-translation is not configured. Add PROVIDER_API_KEY or OPENAI_API_KEY, or save ru/en content manually.",
    );
  }

  try {
    const translatedContent = await translatePlaceWithAi(nameUz, descriptionUz);

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
};
