import { toFile } from "openai/uploads";
import { env } from "../../config/env";
import { AppError } from "../../utils/app-error";
import type { AppLanguage, SpeechToTextProvider, SpeechToTextResponse, STTRequest } from "../../types/suyle-ai.types";
import { isMockAiEnabled, requireSuyleAIClient, withTimeout } from "./provider-client";

function resolveTranscriptionLanguage(languageHint: AppLanguage) {
  if (languageHint === "kaa_latn" || languageHint === "kaa_cyrl") {
    return "uz";
  }

  return languageHint;
}

class MockSpeechToTextProvider implements SpeechToTextProvider {
  async transcribe(request: STTRequest): Promise<SpeechToTextResponse> {
    const textByLanguage: Record<AppLanguage, string> = {
      en: "Where is the nearest pharmacy?",
      kaa_cyrl: "Жақын дорихана анаў көшениң басында.",
      kaa_latn: "Jaqın dorixana anaw kósheniń basında.",
      ru: "Где ближайшая аптека?",
      tr: "En yakın eczane nerede?",
      uz: "Eng yaqin dorixona qayerda?",
    };

    return {
      language: request.languageHint,
      text: textByLanguage[request.languageHint],
    };
  }
}

class OpenAiSpeechToTextProvider implements SpeechToTextProvider {
  async transcribe(request: STTRequest): Promise<SpeechToTextResponse> {
    const client = requireSuyleAIClient("speech-to-text");
    const file = await toFile(request.audioBuffer, request.fileName, {
      type: request.mimeType || "audio/webm",
    });

    const response = await withTimeout(
      client.audio.transcriptions.create({
        file,
        language: resolveTranscriptionLanguage(request.languageHint),
        model: env.SUYLE_AI_STT_MODEL,
      }),
      "Speech recognition service timed out.",
    );

    const text = response.text?.trim();

    if (!text) {
      throw new AppError(502, "Speech provider returned an empty transcription.", "BAD_PROVIDER_RESPONSE");
    }

    return {
      language: request.languageHint,
      text,
    };
  }
}

function createSpeechToTextProvider() {
  return isMockAiEnabled() ? new MockSpeechToTextProvider() : new OpenAiSpeechToTextProvider();
}

export async function speechToText(request: STTRequest) {
  return createSpeechToTextProvider().transcribe(request);
}
