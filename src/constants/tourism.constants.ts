export const CATEGORY_IDS = [
  "history",
  "culture",
  "museum",
  "nature",
  "adventure",
  "food",
] as const;

export const LANGUAGE_CODES = ["kaa", "uz", "en", "ru"] as const;

export const ROUTE_DURATION_MINUTES = {
  "3_hours": 180,
  half_day: 300,
  "1_day": 480,
} as const;

export const ROUTE_START_TIME = "09:00";
export const TRANSFER_BUFFER_MINUTES = 20;
export const CROSS_CITY_TRAVEL_SPEED_KMH = 55;

export const ROUTE_IDEAL_STOP_COUNT = {
  "3_hours": 2,
  half_day: 3,
  "1_day": 4,
} as const;

export const ROUTE_NEARBY_FALLBACK_MAX_DISTANCE_KM = {
  "3_hours": 0,
  half_day: 0,
  "1_day": 160,
} as const;

export const ROUTE_CITY_CLUSTERS: Record<string, string[]> = {
  Nukus: ["Xojeli"],
  Xojeli: ["Nukus"],
  Moynaq: ["Qonirat"],
  Qonirat: ["Moynaq"],
  Ellikqala: [],
};

export const CITY_ALIASES: Record<string, string[]> = {
  Nukus: ["nukus", "nokis"],
  Moynaq: ["moynaq", "muynak", "moinaq"],
  Xojeli: ["xojeli", "khojeli", "khodjeyli", "hojeli"],
  Ellikqala: ["ellikqala", "ellik kala", "ellikala", "ellik-qala"],
  Qonirat: ["qonirat", "kungrad", "kongrat", "qongirat"],
};

export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  history: [
    "history",
    "historic",
    "ancient",
    "fortress",
    "memorial",
    "archaeology",
    "tarix",
    "istoriya",
    "история",
    "qala",
    "kala",
  ],
  culture: [
    "culture",
    "cultural",
    "tradition",
    "theater",
    "theatre",
    "craft",
    "art",
    "madaniyat",
    "medeniyat",
    "kultura",
    "культура",
  ],
  museum: [
    "museum",
    "gallery",
    "exhibition",
    "collection",
    "muzey",
    "muzei",
    "музей",
  ],
  nature: [
    "nature",
    "sea",
    "lake",
    "plateau",
    "viewpoint",
    "landscape",
    "tabiat",
    "priroda",
    "природа",
    "aral",
    "ustyurt",
  ],
  adventure: [
    "adventure",
    "offroad",
    "desert",
    "road trip",
    "explore",
    "sarguzasht",
    "priklyucheniye",
    "приключение",
    "safari",
  ],
  food: [
    "food",
    "eat",
    "meal",
    "restaurant",
    "bazaar",
    "market",
    "taom",
    "ovqat",
    "eda",
    "еда",
    "cafe",
    "kafe",
  ],
};

export const DURATION_KEYWORDS = {
  "3_hours": [
    "3 hours",
    "3 hour",
    "2 hours",
    "2 hour",
    "few hours",
    "3 soat",
    "2 soat",
    "qisqa",
    "3 chasa",
    "2 chasa",
    "3 часа",
    "2 часа",
  ],
  half_day: [
    "half day",
    "4 hours",
    "4 hour",
    "5 hours",
    "5 hour",
    "yarim kun",
    "pol dnya",
    "4 soat",
    "5 soat",
    "4 часа",
    "5 часов",
  ],
  "1_day": [
    "1 day",
    "one day",
    "full day",
    "day trip",
    "bir kun",
    "1 kun",
    "kunlik",
    "ves den",
    "tselyy den",
    "1 день",
    "целый день",
    "весь день",
  ],
} as const;
