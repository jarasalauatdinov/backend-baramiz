import { env } from "../../../config/env";
import type {
  AppLanguage,
  InternalTranslateParams,
  InternalTranslateResult,
  TahrirchiTranslateRequest,
  TahrirchiTranslateResponse,
  TranslationProvider,
} from "../../../types/suyle-ai.types";
import { AppError } from "../../../utils/app-error";

export function mapToTahrirchiLanguageCode(language: AppLanguage) {
  switch (language) {
    case "en":
      return "eng_Latn";
    case "ru":
      return "rus_Cyrl";
    case "uz":
      return "uzn_Latn";
    case "tr":
      return "tur_Latn";
    case "kaa_latn":
      return "kaa_Latn";
    case "kaa_cyrl":
      return "kaa_Cyrl";
    default:
      throw new Error(`Unsupported language: ${language}`);
  }
}

const parseTahrirchiResponse = (rawText: string): TahrirchiTranslateResponse => {
  try {
    return JSON.parse(rawText) as TahrirchiTranslateResponse;
  } catch {
    throw new AppError(
      502,
      "Tahrirchi translation failed",
      "BAD_PROVIDER_RESPONSE",
      undefined,
      rawText,
    );
  }
};

export class TahrirchiTranslationProvider implements TranslationProvider {
  async translate(params: InternalTranslateParams): Promise<InternalTranslateResult> {
    if (!env.TAHRIRCHI_API_KEY) {
      throw new AppError(503, "Missing TAHRIRCHI_API_KEY for translation provider.", "MISSING_TAHRIRCHI_API_KEY");
    }

    const providerSourceCode = mapToTahrirchiLanguageCode(params.sourceLanguage);
    const providerTargetCode = mapToTahrirchiLanguageCode(params.targetLanguage);
    const requestBody: TahrirchiTranslateRequest = {
      text: params.text,
      source_lang: providerSourceCode,
      target_lang: providerTargetCode,
      model: env.TAHRIRCHI_MODEL || "sayqalchi",
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), env.AI_REQUEST_TIMEOUT_MS);

    try {
      console.log("TAHRIRCHI REQUEST:", requestBody);

      const response = await fetch(env.TAHRIRCHI_TRANSLATE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: env.TAHRIRCHI_API_KEY,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      const rawText = await response.text();

      console.log("TAHRIRCHI STATUS:", response.status);
      console.log("TAHRIRCHI RAW:", rawText);

      if (!response.ok) {
        throw new AppError(
          502,
          "Tahrirchi translation failed",
          "TAHRIRCHI_REQUEST_FAILED",
          undefined,
          rawText,
        );
      }

      const payload = parseTahrirchiResponse(rawText);
      const translatedText = payload.translated_text?.trim();

      if (!translatedText) {
        throw new AppError(
          502,
          "Tahrirchi translation failed",
          "BAD_PROVIDER_RESPONSE",
          undefined,
          rawText,
        );
      }

      return {
        providerSourceCode,
        providerTargetCode,
        translatedText,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      if (error instanceof Error && error.name === "AbortError") {
        throw new AppError(504, "Tahrirchi translation timed out.", "TRANSLATION_TIMEOUT");
      }

      if (error instanceof Error) {
        throw new AppError(
          502,
          "Tahrirchi translation failed",
          "TAHRIRCHI_REQUEST_FAILED",
          undefined,
          error.message,
        );
      }

      throw new AppError(502, "Tahrirchi translation failed", "TAHRIRCHI_REQUEST_FAILED");
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
