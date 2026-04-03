import { CATEGORY_KEYWORDS, CITY_ALIASES, DURATION_KEYWORDS } from "../constants/tourism.constants";
import type {
  CategoryId,
  Language,
  LocalizedValue,
  MultilingualText,
  MultilingualTextInput,
  Place,
  RouteDuration,
} from "../types/tourism.types";

export const normalizeText = (value: string): string => {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
};

export const localize = <T>(language: Language, dictionary: Partial<Record<Language, T>> & { en: T }): T => {
  return dictionary[language] ?? dictionary.uz ?? dictionary.en;
};

const coerceLocalizedString = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : undefined;
};

const findFirstLocalizedFallback = (value: Partial<Record<Language, string>>): string | undefined => {
  return value.uz?.trim()
    || value.en?.trim()
    || value.ru?.trim()
    || value.kaa?.trim();
};

export const normalizeMultilingualTextInput = (
  value: MultilingualTextInput | undefined,
  fallbackValue?: string,
): MultilingualText | undefined => {
  if (typeof value === "string") {
    const normalizedValue = coerceLocalizedString(value) ?? fallbackValue?.trim();

    if (!normalizedValue) {
      return undefined;
    }

    return {
      kaa: normalizedValue,
      uz: normalizedValue,
      ru: normalizedValue,
      en: normalizedValue,
    };
  }

  if (!value || typeof value !== "object") {
    return fallbackValue ? {
      kaa: fallbackValue,
      uz: fallbackValue,
      ru: fallbackValue,
      en: fallbackValue,
    } : undefined;
  }

  const firstAvailableValue = findFirstLocalizedFallback(value) ?? fallbackValue?.trim();

  if (!firstAvailableValue) {
    return undefined;
  }

  return {
    kaa: coerceLocalizedString(value.kaa) ?? firstAvailableValue,
    uz: coerceLocalizedString(value.uz) ?? firstAvailableValue,
    ru: coerceLocalizedString(value.ru) ?? firstAvailableValue,
    en: coerceLocalizedString(value.en) ?? firstAvailableValue,
  };
};

export const localizeMultilingualText = (
  value: MultilingualText | undefined,
  language: Language,
): string | undefined => {
  if (!value) {
    return undefined;
  }

  return localize(language, value);
};

export const getLocalizedPlaceName = (place: Place, language: Language): string => {
  return localize(language, {
    kaa: place.name_kaa || place.name || place.name_uz || place.name_en,
    uz: place.name_uz || place.name || place.name_en,
    ru: place.name_ru || place.name || place.name_uz,
    en: place.name_en || place.name || place.name_uz,
  });
};

export const getLocalizedPlaceDescription = (place: Place, language: Language): string => {
  return localize(language, {
    kaa: place.description_kaa || place.description || place.description_uz || place.description_en,
    uz: place.description_uz || place.description || place.description_en,
    ru: place.description_ru || place.description || place.description_uz,
    en: place.description_en || place.description || place.description_uz,
  });
};

export const localizePlace = (place: Place, language: Language): Place => {
  return {
    ...place,
    name: getLocalizedPlaceName(place, language),
    description: getLocalizedPlaceDescription(place, language),
  };
};

const getCitySearchTerms = (city: string): string[] => {
  const aliases = CITY_ALIASES[city] ?? [];
  return Array.from(new Set([city, ...aliases].map((term) => normalizeText(term))));
};

export const resolveCityName = (value: string, places: Place[]): string | undefined => {
  const normalizedValue = normalizeText(value);

  if (!normalizedValue) {
    return undefined;
  }

  const uniqueCities = Array.from(new Set(places.map((place) => place.city)));

  const exactMatch = uniqueCities.find((city) => {
    return getCitySearchTerms(city).some((term) => term === normalizedValue);
  });

  if (exactMatch) {
    return exactMatch;
  }

  return uniqueCities.find((city) => {
    return getCitySearchTerms(city).some((term) => {
      return term.includes(normalizedValue) || normalizedValue.includes(term);
    });
  });
};

export const detectCityFromMessage = (message: string, places: Place[]): string | undefined => {
  const normalizedMessage = normalizeText(message);
  const uniqueCities = Array.from(new Set(places.map((place) => place.city)));

  const matchedCity = uniqueCities
    .map((city) => ({
      city,
      matchLength: getCitySearchTerms(city)
        .filter((term) => normalizedMessage.includes(term))
        .reduce((longest, term) => Math.max(longest, term.length), 0),
    }))
    .filter((candidate) => candidate.matchLength > 0)
    .sort((left, right) => right.matchLength - left.matchLength)[0];

  return matchedCity?.city;
};

export const detectPlaceFromMessage = (message: string, places: Place[]): Place | undefined => {
  const normalizedMessage = normalizeText(message);

  return [...places]
    .map((place) => {
      const searchableNames = [place.name, place.name_uz, place.name_en, place.name_ru, place.name_kaa]
        .map((name) => normalizeText(name))
        .filter(Boolean);

      const longestMatch = searchableNames
        .filter((name) => normalizedMessage.includes(name))
        .reduce((longest, name) => Math.max(longest, name.length), 0);

      return {
        place,
        longestMatch,
      };
    })
    .filter((candidate) => candidate.longestMatch > 0)
    .sort((left, right) => right.longestMatch - left.longestMatch)[0]
    ?.place;
};

export const detectDurationFromMessage = (message: string): RouteDuration | undefined => {
  const normalizedMessage = normalizeText(message);
  const hoursMatch = normalizedMessage.match(/(\d+)\s*(hour|hours|hr|hrs|soat|chas|час|часа|часов)/u);

  if (hoursMatch) {
    const hours = Number(hoursMatch[1]);

    if (hours >= 6) {
      return "1_day";
    }

    if (hours >= 4) {
      return "half_day";
    }

    if (hours >= 1) {
      return "3_hours";
    }
  }

  const dayMatch = normalizedMessage.match(/(\d+)?\s*(day|days|kun|день|дня)/u);

  if (dayMatch) {
    return "1_day";
  }

  for (const duration of Object.keys(DURATION_KEYWORDS) as RouteDuration[]) {
    if (DURATION_KEYWORDS[duration].some((keyword) => normalizedMessage.includes(normalizeText(keyword)))) {
      return duration;
    }
  }

  return undefined;
};

export const detectInterestsFromMessage = (message: string): CategoryId[] => {
  const normalizedMessage = normalizeText(message);
  const detectedInterests = new Set<CategoryId>();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((keyword) => normalizedMessage.includes(normalizeText(keyword)))) {
      detectedInterests.add(category as CategoryId);
    }
  }

  return Array.from(detectedInterests);
};

export const getCategoryLabel = (category: CategoryId, language: Language): string => {
  const labels: Record<CategoryId, Partial<Record<Language, string>> & { en: string }> = {
    history: {
      kaa: "tariyx",
      uz: "tarix",
      ru: "история",
      en: "history",
    },
    culture: {
      kaa: "mádeniyat",
      uz: "madaniyat",
      ru: "культура",
      en: "culture",
    },
    museum: {
      kaa: "muzey",
      uz: "muzey",
      ru: "музей",
      en: "museum",
    },
    nature: {
      kaa: "tábiyat",
      uz: "tabiat",
      ru: "природа",
      en: "nature",
    },
    adventure: {
      kaa: "sárguzasht",
      uz: "sarguzasht",
      ru: "приключение",
      en: "adventure",
    },
    food: {
      kaa: "taam",
      uz: "taom",
      ru: "еда",
      en: "food",
    },
  };

  return localize(language, labels[category]);
};

export const formatPlaceNames = (places: Place[], language: Language): string => {
  return places.map((place) => getLocalizedPlaceName(place, language)).join(", ");
};

export const buildChatSuggestions = (language: Language): string[] => {
  return localize(language, {
    kaa: [
      "Nukus ushin 1 kúnlik marshrut dúzip ber.",
      "Moynaqda 3 saat ishinde nelerdi kóriwge boladi?",
      "Tarix hám mádeniyat orınların usınıs et.",
    ],
    uz: [
      "Nukus uchun 1 kunlik marshrut tuzib ber.",
      "Moynaqda 3 soatda nimalarni ko'rish mumkin?",
      "Tarix va madaniyatga oid joylarni tavsiya qil.",
    ],
    ru: [
      "Собери маршрут по Нукусу на 1 день.",
      "Что посмотреть в Мойнаке за 3 часа?",
      "Посоветуй места по истории и культуре.",
    ],
    en: [
      "Build me a 1-day route for Nukus.",
      "What can I see in Moynaq in 3 hours?",
      "Recommend history and culture places.",
    ],
  });
};

export const createShortDescription = (value: string): string => {
  const trimmedValue = value.trim();
  const firstSentence = trimmedValue.match(/^.*?[.!?](\s|$)/u)?.[0]?.trim();
  return firstSentence && firstSentence.length > 0 ? firstSentence : trimmedValue;
};

export const slugify = (value: string): string => {
  return normalizeText(value).replace(/\s+/g, "-");
};

export const createLocalizedValue = <T>(en: T, overrides: Partial<Record<Language, T>> = {}): LocalizedValue<T> => ({
  en,
  uz: overrides.uz,
  ru: overrides.ru,
  kaa: overrides.kaa,
});
