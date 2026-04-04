import type { Request } from "express";
import type { Language } from "../types/tourism.types";

const SUPPORTED_LANGUAGES = new Set<Language>(["uz", "ru", "en", "kaa"]);

const normalizeLanguageCandidate = (value: string | undefined): Language | undefined => {
  if (!value) {
    return undefined;
  }

  const trimmedValue = value.trim().toLowerCase();

  if (!trimmedValue) {
    return undefined;
  }

  const directMatch = trimmedValue.split(",")[0]?.split(";")[0]?.trim();

  if (directMatch && SUPPORTED_LANGUAGES.has(directMatch as Language)) {
    return directMatch as Language;
  }

  const languageCode = directMatch?.split("-")[0]?.trim();

  if (languageCode && SUPPORTED_LANGUAGES.has(languageCode as Language)) {
    return languageCode as Language;
  }

  return undefined;
};

export const resolveRequestLanguage = (
  request: Request,
  explicitLanguage?: Language,
): Language => {
  if (explicitLanguage) {
    return explicitLanguage;
  }

  const headerLanguage = normalizeLanguageCandidate(request.header("x-language"))
    || normalizeLanguageCandidate(request.header("x-lang"))
    || normalizeLanguageCandidate(request.header("accept-language"));

  return headerLanguage ?? "en";
};
