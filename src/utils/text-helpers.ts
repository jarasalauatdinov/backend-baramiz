import { CATEGORY_KEYWORDS, CITY_ALIASES } from "../constants/tourism.constants";
import type { CategoryId, Language, Place, RouteDuration } from "../types/tourism.types";

export const normalizeText = (value: string): string => value.trim().toLowerCase();

export const localize = <T>(language: Language, dictionary: Record<Language, T>): T => {
  return dictionary[language] ?? dictionary.en;
};

export const detectCityFromMessage = (message: string, places: Place[]): string | undefined => {
  const normalizedMessage = normalizeText(message);
  const uniqueCities = Array.from(new Set(places.map((place) => place.city)));

  for (const city of uniqueCities) {
    const aliases = CITY_ALIASES[city] ?? [city.toLowerCase()];
    const searchableTerms = [city.toLowerCase(), ...aliases.map((alias) => alias.toLowerCase())];

    if (searchableTerms.some((term) => normalizedMessage.includes(term))) {
      return city;
    }
  }

  return undefined;
};

export const detectDurationFromMessage = (message: string): RouteDuration | undefined => {
  const normalizedMessage = normalizeText(message);

  if (
    normalizedMessage.includes("1 day") ||
    normalizedMessage.includes("one day") ||
    normalizedMessage.includes("full day") ||
    normalizedMessage.includes("day trip")
  ) {
    return "1_day";
  }

  if (
    normalizedMessage.includes("half day") ||
    normalizedMessage.includes("4 hours") ||
    normalizedMessage.includes("5 hours")
  ) {
    return "half_day";
  }

  if (
    normalizedMessage.includes("3 hours") ||
    normalizedMessage.includes("3 hour") ||
    normalizedMessage.includes("2 hours") ||
    normalizedMessage.includes("few hours") ||
    normalizedMessage.includes("short")
  ) {
    return "3_hours";
  }

  return undefined;
};

export const detectInterestsFromMessage = (message: string): CategoryId[] => {
  const normalizedMessage = normalizeText(message);
  const detectedInterests = new Set<CategoryId>();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((keyword) => normalizedMessage.includes(keyword))) {
      detectedInterests.add(category as CategoryId);
    }
  }

  return Array.from(detectedInterests);
};

export const formatPlaceNames = (places: Place[]): string => {
  return places.map((place) => place.name).join(", ");
};

export const buildChatSuggestions = (language: Language): string[] => {
  return localize(language, {
    uz: [
      "Nukus uchun 1 kunlik marshrut tuzib ber.",
      "Moynaqda 3 soatda nimalarni ko'rish mumkin?",
      "Tarix va madaniyatga oid joylarni tavsiya qil.",
    ],
    en: [
      "Build me a 1-day route for Nukus.",
      "What can I see in Moynaq in 3 hours?",
      "Recommend history and culture places.",
    ],
    ru: [
      "\u0421\u043e\u0441\u0442\u0430\u0432\u044c \u043c\u0430\u0440\u0448\u0440\u0443\u0442 \u043d\u0430 1 \u0434\u0435\u043d\u044c \u043f\u043e \u041d\u0443\u043a\u0443\u0441\u0443.",
      "\u0427\u0442\u043e \u043f\u043e\u0441\u043c\u043e\u0442\u0440\u0435\u0442\u044c \u0432 \u041c\u0443\u0439\u043d\u0430\u043a\u0435 \u0437\u0430 3 \u0447\u0430\u0441\u0430?",
      "\u041f\u043e\u0441\u043e\u0432\u0435\u0442\u0443\u0439 \u043c\u0435\u0441\u0442\u0430 \u043f\u043e \u0438\u0441\u0442\u043e\u0440\u0438\u0438 \u0438 \u043a\u0443\u043b\u044c\u0442\u0443\u0440\u0435.",
    ],
  });
};
