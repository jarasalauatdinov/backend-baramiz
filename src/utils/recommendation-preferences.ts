import type { CategoryId, Language, Place, RecommendationPreferenceId } from "../types/tourism.types";
import { localize, normalizeText } from "./text-helpers";

const CULTURAL_CATEGORIES = new Set<CategoryId>(["history", "culture", "museum"]);
const SCENIC_CATEGORIES = new Set<CategoryId>(["nature", "adventure"]);
const FAMILY_CATEGORIES = new Set<CategoryId>(["museum", "nature", "culture", "history"]);
const SOLO_CATEGORIES = new Set<CategoryId>(["history", "culture", "museum", "nature", "food"]);

const SCENIC_KEYWORDS = ["view", "scenic", "panorama", "landscape", "aral", "plateau", "fortress"];
const QUIET_KEYWORDS = ["quiet", "peaceful", "remote", "calm", "desert", "cemetery"];

function placeText(place: Place) {
  return normalizeText([place.name, place.description, place.shortDescription, ...place.tags].join(" "));
}

function hasKeyword(place: Place, keywords: string[]) {
  const normalized = placeText(place);
  return keywords.some((keyword) => normalized.includes(normalizeText(keyword)));
}

export function getRecommendationPreferenceLabel(
  preference: RecommendationPreferenceId,
  language: Language,
): string {
  return localize(language, {
    kaa: {
      popular_places: "mashhur orinlar",
      hidden_gems: "jasirin durdanalar",
      easy_to_reach: "jetip barıw oñay",
      family_friendly: "shanaraq ushin mas",
      solo_friendly: "jeke sayahat ushin mas",
      scenic_views: "kórinisli orınlar",
      quiet_places: "tinsh orinlar",
      cultural_spots: "mádeniy orınlar",
    }[preference],
    uz: {
      popular_places: "mashhur joylar",
      hidden_gems: "yashirin durdonalar",
      easy_to_reach: "yetib borish oson",
      family_friendly: "oila uchun mos",
      solo_friendly: "yakka sayohat uchun mos",
      scenic_views: "manzarali joylar",
      quiet_places: "tinch joylar",
      cultural_spots: "madaniy joylar",
    }[preference],
    ru: {
      popular_places: "популярные места",
      hidden_gems: "скрытые жемчужины",
      easy_to_reach: "легко добраться",
      family_friendly: "подходит для семьи",
      solo_friendly: "подходит для соло-поездки",
      scenic_views: "живописные места",
      quiet_places: "тихие места",
      cultural_spots: "культурные места",
    }[preference],
    en: {
      popular_places: "popular places",
      hidden_gems: "hidden gems",
      easy_to_reach: "easy to reach",
      family_friendly: "family friendly",
      solo_friendly: "good for solo travel",
      scenic_views: "scenic views",
      quiet_places: "quiet places",
      cultural_spots: "cultural spots",
    }[preference],
  });
}

export function matchesRecommendationPreference(
  place: Place,
  preference: RecommendationPreferenceId,
  requestedCity: string,
): boolean {
  const isSameCity = normalizeText(place.city) === normalizeText(requestedCity);

  switch (preference) {
    case "popular_places":
      return place.featured || (place.rating ?? 0) >= 4.6;
    case "hidden_gems":
      return !place.featured;
    case "easy_to_reach":
      return isSameCity && place.duration <= 110;
    case "family_friendly":
      return isSameCity && place.duration <= 120 && FAMILY_CATEGORIES.has(place.category);
    case "solo_friendly":
      return isSameCity || SOLO_CATEGORIES.has(place.category);
    case "scenic_views":
      return SCENIC_CATEGORIES.has(place.category) || hasKeyword(place, SCENIC_KEYWORDS);
    case "quiet_places":
      return (!place.featured && (SCENIC_CATEGORIES.has(place.category) || CULTURAL_CATEGORIES.has(place.category)))
        || hasKeyword(place, QUIET_KEYWORDS);
    case "cultural_spots":
      return CULTURAL_CATEGORIES.has(place.category);
    default:
      return false;
  }
}

export function getRecommendationPreferenceScore(
  place: Place,
  preferences: RecommendationPreferenceId[],
  requestedCity: string,
): number {
  return preferences.reduce((score, preference) => {
    if (!matchesRecommendationPreference(place, preference, requestedCity)) {
      return score;
    }

    switch (preference) {
      case "popular_places":
        return score + 34;
      case "hidden_gems":
        return score + 28;
      case "easy_to_reach":
        return score + 26;
      case "family_friendly":
        return score + 22;
      case "solo_friendly":
        return score + 16;
      case "scenic_views":
        return score + 30;
      case "quiet_places":
        return score + 24;
      case "cultural_spots":
        return score + 30;
      default:
        return score;
    }
  }, 0);
}

export function getPrimaryMatchingPreference(
  place: Place,
  preferences: RecommendationPreferenceId[],
  requestedCity: string,
): RecommendationPreferenceId | null {
  return preferences.find((preference) => matchesRecommendationPreference(place, preference, requestedCity)) ?? null;
}
