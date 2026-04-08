import { z } from "zod";

export const touristLanguageSchema = z.enum(["uz", "ru", "en", "tr"]);
export const localLanguageSchema = z.enum(["kaa_latn", "kaa_cyrl"]);
export const appLanguageSchema = z.enum(["uz", "ru", "en", "tr", "kaa_latn", "kaa_cyrl"]);

const textSchema = z.string().trim().min(1, "text is required").max(700, "text is too long");

export const translateTouristToLocalBodySchema = z.object({
  sourceLanguage: touristLanguageSchema,
  targetLocalScript: localLanguageSchema.default("kaa_latn"),
  text: textSchema,
});

export const translateLocalToTouristBodySchema = z.object({
  sourceLocalScript: localLanguageSchema.default("kaa_latn"),
  targetLanguage: touristLanguageSchema,
  text: textSchema,
});

export const speechToTextBodySchema = z.object({
  languageHint: appLanguageSchema.optional().default("en"),
});

export const textToSpeechBodySchema = z.object({
  language: appLanguageSchema,
  text: textSchema,
});
