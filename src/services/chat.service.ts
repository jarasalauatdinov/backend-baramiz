import type { CategoryId, ChatRequest, ChatResponse, Language, Place, RouteDuration } from "../types/tourism.types";
import {
  buildChatSuggestions,
  detectCityFromMessage,
  detectDurationFromMessage,
  detectInterestsFromMessage,
  detectPlaceFromMessage,
  formatPlaceNames,
  getCategoryLabel,
  localize,
} from "../utils/text-helpers";
import { createAiChatReply, isAiProviderEnabled } from "./ai-provider.service";
import { generateRoute } from "./route-generator.service";
import { getAllPlaces, getFeaturedPlaces, getPlacesByCity } from "./places.service";

interface ChatInsights {
  allPlaces: Place[];
  detectedCity?: string;
  detectedDuration?: RouteDuration;
  detectedInterests: CategoryId[];
  detectedPlace?: Place;
  relevantPlaces: Place[];
}

const scorePlace = (
  place: Place,
  city?: string,
  interests: CategoryId[] = [],
  detectedPlace?: Place,
): number => {
  let score = 0;

  if (detectedPlace && place.id === detectedPlace.id) {
    score += 8;
  }

  if (city && place.city.toLowerCase() === city.toLowerCase()) {
    score += 4;
  }

  if (interests.includes(place.category)) {
    score += 3;
  }

  if (place.featured) {
    score += 1;
  }

  return score;
};

const buildRelevantContext = (
  allPlaces: Place[],
  city?: string,
  interests: CategoryId[] = [],
  detectedPlace?: Place,
): Place[] => {
  return [...allPlaces]
    .sort((leftPlace, rightPlace) => {
      const leftScore = scorePlace(leftPlace, city, interests, detectedPlace);
      const rightScore = scorePlace(rightPlace, city, interests, detectedPlace);

      if (leftScore !== rightScore) {
        return rightScore - leftScore;
      }

      if (leftPlace.featured !== rightPlace.featured) {
        return Number(rightPlace.featured) - Number(leftPlace.featured);
      }

      return leftPlace.name.localeCompare(rightPlace.name);
    })
    .slice(0, 6);
};

const buildInsights = (input: ChatRequest): ChatInsights => {
  const allPlaces = getAllPlaces(input.language);
  const detectedCity = detectCityFromMessage(input.message, allPlaces);
  const detectedDuration = detectDurationFromMessage(input.message);
  const detectedInterests = detectInterestsFromMessage(input.message);
  const detectedPlace = detectPlaceFromMessage(input.message, allPlaces);
  const relevantPlaces = buildRelevantContext(allPlaces, detectedCity, detectedInterests, detectedPlace);

  return {
    allPlaces,
    detectedCity,
    detectedDuration,
    detectedInterests,
    detectedPlace,
    relevantPlaces,
  };
};

const buildPromptInstructions = (): string[] => {
  return [
    "Answer as a Baramiz travel assistant for Karakalpakstan.",
    "Keep the answer short, practical, and tourism-focused.",
    "Prefer the provided local places over generic advice.",
    "Use exact local place names from the context when possible.",
    "If the request is vague, ask for city or available time in one short sentence.",
  ];
};

const resolvePreferredInterests = (
  city: string,
  detectedInterests: CategoryId[],
  language: Language,
): CategoryId[] => {
  if (detectedInterests.length > 0) {
    return detectedInterests;
  }

  const cityPlaces = getPlacesByCity(city, language);
  const categoryCounts = new Map<CategoryId, number>();

  for (const place of cityPlaces) {
    const existingCount = categoryCounts.get(place.category) ?? 0;
    categoryCounts.set(place.category, existingCount + (place.featured ? 2 : 1));
  }

  const rankedCategories = [...categoryCounts.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([category]) => category);

  return rankedCategories.slice(0, 2).length > 0 ? rankedCategories.slice(0, 2) : ["history", "culture"];
};

const buildSpecificPlaceReply = (language: Language, place: Place, allPlaces: Place[]): string => {
  const nearbyPlaces = allPlaces
    .filter((candidatePlace) => candidatePlace.city === place.city && candidatePlace.id !== place.id)
    .sort((leftPlace, rightPlace) => {
      if (leftPlace.featured !== rightPlace.featured) {
        return Number(rightPlace.featured) - Number(leftPlace.featured);
      }

      return leftPlace.duration - rightPlace.duration;
    })
    .slice(0, 2);

  const nearbySummary = nearbyPlaces.length > 0 ? formatPlaceNames(nearbyPlaces, language) : place.city;
  const categoryLabel = getCategoryLabel(place.category, language);

  return localize(language, {
    kaa: `${place.name} ${place.city}dagi kúshli ${categoryLabel} stoplardan biri. Bul jerge shamamen ${place.duration} minut ajıratıń. Onı ${nearbySummary} menen birge kóriw qolay.`,
    uz: `${place.name} ${place.city}dagi kuchli ${categoryLabel} stoplaridan biri. Bu joy uchun taxminan ${place.duration} daqiqa ajrating. Uni ${nearbySummary} bilan birga ko'rish qulay bo'ladi.`,
    ru: `${place.name} это одна из сильных ${categoryLabel} точек в ${place.city}. Заложите на нее примерно ${place.duration} минут. Ее удобно сочетать с ${nearbySummary}.`,
    en: `${place.name} is one of the stronger ${categoryLabel} stops in ${place.city}. Plan about ${place.duration} minutes there. It pairs well with ${nearbySummary}.`,
  });
};

const buildRouteReply = (
  language: Language,
  city: string,
  duration: RouteDuration,
  detectedInterests: CategoryId[],
): string | null => {
  try {
    const route = generateRoute({
      city,
      duration,
      interests: resolvePreferredInterests(city, detectedInterests, language),
      language,
    });

    const stopSummary = route.stops
      .slice(0, 4)
      .map((stop) => `${stop.order}. ${stop.name}`)
      .join("; ");

    return localize(language, {
      kaa: `${city} ushın ámeliy reja: ${stopSummary}. Qáleseńiz, men buni qısqaraq yaki bir temaǵa beyimlep qayta dúzemen.`,
      uz: `${city} uchun amaliy reja: ${stopSummary}. Xohlasangiz, buni qisqaroq yoki bitta mavzuga moslab qayta tuzaman.`,
      ru: `Практичный план для ${city}: ${stopSummary}. Если хотите, я могу сделать его короче или сфокусировать на одной теме.`,
      en: `A practical ${city} plan is: ${stopSummary}. If you want, I can make it shorter or more focused on one theme.`,
    });
  } catch {
    return null;
  }
};

const buildCityReply = (language: Language, city: string, detectedInterests: CategoryId[]): string => {
  const cityPlaces = getPlacesByCity(city, language);
  const recommendations = cityPlaces
    .sort((leftPlace, rightPlace) => {
      const leftInterestScore = detectedInterests.includes(leftPlace.category) ? 1 : 0;
      const rightInterestScore = detectedInterests.includes(rightPlace.category) ? 1 : 0;

      if (leftInterestScore !== rightInterestScore) {
        return rightInterestScore - leftInterestScore;
      }

      if (leftPlace.featured !== rightPlace.featured) {
        return Number(rightPlace.featured) - Number(leftPlace.featured);
      }

      return leftPlace.duration - rightPlace.duration;
    })
    .slice(0, 3);

  const summary = recommendations
    .map((place) => `${place.name} (${place.duration} min)`)
    .join(", ");

  return localize(language, {
    kaa: `${city} ushın jaqsı baslanıw: ${summary}. Waqtıńızdı jazsańız, men anıq marshrut dúzip beremen.`,
    uz: `${city} uchun yaxshi boshlanish: ${summary}. Vaqtingizni yozsangiz, men aniq marshrut tuzib beraman.`,
    ru: `Хороший старт для ${city}: ${summary}. Если напишете, сколько у вас времени, я соберу точный маршрут.`,
    en: `A strong starting set for ${city} is ${summary}. If you share your available time, I can turn it into a precise route.`,
  });
};

const buildInterestReply = (language: Language, detectedInterests: CategoryId[], allPlaces: Place[]): string => {
  const interestPlaces = allPlaces
    .filter((place) => detectedInterests.includes(place.category))
    .sort((leftPlace, rightPlace) => {
      if (leftPlace.featured !== rightPlace.featured) {
        return Number(rightPlace.featured) - Number(leftPlace.featured);
      }

      return leftPlace.name.localeCompare(rightPlace.name);
    })
    .slice(0, 4);

  const summary = interestPlaces
    .map((place) => `${place.name} (${place.city})`)
    .join(", ");
  const interestLabels = detectedInterests.map((interest) => getCategoryLabel(interest, language)).join(", ");

  return localize(language, {
    kaa: `${interestLabels} ushın kúshli variantlar: ${summary}. Qala yaki waqıt aralıǵın jazsańız, men tańlawdı anıǵraq qısqartaman.`,
    uz: `${interestLabels} uchun kuchli variantlar: ${summary}. Shahar yoki vaqtni yozsangiz, men tanlovni aniqroq qisqartiraman.`,
    ru: `Сильные варианты по теме ${interestLabels}: ${summary}. Напишите город или временное окно, и я сузжу выбор.`,
    en: `Strong options for ${interestLabels} are ${summary}. Tell me your city or time window, and I will narrow this down properly.`,
  });
};

const buildGeneralReply = (language: Language): string => {
  const featuredPlaces = getFeaturedPlaces(4, language);
  const featuredSummary = featuredPlaces
    .map((place) => `${place.name} (${place.city})`)
    .join(", ");

  return localize(language, {
    kaa: `Baslaw ushın jaqsı variantlar: ${featuredSummary}. Qala yaki sapar uzaqlıǵın jazsańız, men bunı anıǵraq etemen.`,
    uz: `Boshlash uchun yaxshi variantlar: ${featuredSummary}. Shahar yoki vaqtni yozsangiz, men tavsiyani aniqroq qilaman.`,
    ru: `Хороший старт: ${featuredSummary}. Напишите город или длительность поездки, и я уточню план.`,
    en: `A strong starting set is ${featuredSummary}. Tell me your city or trip length, and I will make it more specific.`,
  });
};

const buildFallbackReply = (language: Language, insights: ChatInsights): string => {
  const { allPlaces, detectedCity, detectedDuration, detectedInterests, detectedPlace } = insights;

  if (detectedPlace) {
    return buildSpecificPlaceReply(language, detectedPlace, allPlaces);
  }

  if (detectedCity && detectedDuration) {
    const routeReply = buildRouteReply(language, detectedCity, detectedDuration, detectedInterests);

    if (routeReply) {
      return routeReply;
    }
  }

  if (detectedCity) {
    return buildCityReply(language, detectedCity, detectedInterests);
  }

  if (detectedInterests.length > 0) {
    return buildInterestReply(language, detectedInterests, allPlaces);
  }

  return buildGeneralReply(language);
};

export const replyToChat = async (input: ChatRequest): Promise<ChatResponse> => {
  const insights = buildInsights(input);

  if (isAiProviderEnabled()) {
    try {
      const providerReply = await createAiChatReply({
        message: input.message,
        language: input.language,
        contextPlaces: insights.relevantPlaces,
        instructions: buildPromptInstructions(),
      });

      if (providerReply) {
        return {
          reply: providerReply,
          source: "openai",
          suggestions: buildChatSuggestions(input.language),
        };
      }
    } catch (error) {
      console.error("AI chat fallback triggered:", error);
    }
  }

  return {
    reply: buildFallbackReply(input.language, insights),
    source: "fallback",
    suggestions: buildChatSuggestions(input.language),
  };
};
