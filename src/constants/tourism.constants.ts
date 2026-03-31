export const CATEGORY_IDS = [
  "history",
  "culture",
  "museum",
  "nature",
  "adventure",
  "food",
] as const;

export const LANGUAGE_CODES = ["uz", "en", "ru"] as const;

export const ROUTE_DURATION_MINUTES = {
  "3_hours": 180,
  half_day: 300,
  "1_day": 480,
} as const;

export const TRANSFER_BUFFER_MINUTES = 20;
export const ROUTE_START_TIME = "09:00";

export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  history: ["history", "historic", "ancient", "fortress", "memorial", "archeology"],
  culture: ["culture", "cultural", "tradition", "theater", "craft", "art"],
  museum: ["museum", "gallery", "exhibition", "collection"],
  nature: ["nature", "sea", "lake", "plateau", "viewpoint", "landscape"],
  adventure: ["adventure", "offroad", "desert", "trip", "road", "explore"],
  food: ["food", "eat", "meal", "restaurant", "bazaar", "market", "dish"],
};

export const CITY_ALIASES: Record<string, string[]> = {
  Nukus: ["nukus"],
  Moynaq: ["moynaq", "muynak", "moinaq"],
  Xojeli: ["xojeli", "khojeli", "khodjeyli"],
  Ellikqala: ["ellikqala", "ellik kala", "ellikala"],
  Qonirat: ["qonirat", "kungrad", "kongrat"],
};
