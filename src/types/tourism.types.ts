import { CATEGORY_IDS, LANGUAGE_CODES, ROUTE_DURATION_MINUTES } from "../constants/tourism.constants";

export type CategoryId = (typeof CATEGORY_IDS)[number];
export type Language = (typeof LANGUAGE_CODES)[number];
export type RouteDuration = keyof typeof ROUTE_DURATION_MINUTES;

export interface Category {
  id: CategoryId;
  name: string;
  description: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface LocalizedPlaceFields {
  name_kaa: string;
  name_uz: string;
  name_ru: string;
  name_en: string;
  description_kaa: string;
  description_uz: string;
  description_ru: string;
  description_en: string;
}

export interface AdminLocalizedPlaceFields {
  name_kaa: string;
  name_uz: string;
  name_ru?: string;
  name_en?: string;
  description_kaa: string;
  description_uz: string;
  description_ru?: string;
  description_en?: string;
}

export interface Place extends LocalizedPlaceFields {
  id: string;
  name: string;
  city: string;
  region: string;
  category: CategoryId;
  durationMinutes: number;
  description: string;
  image: string;
  coordinates: Coordinates;
  featured: boolean;
}

export interface AdminPlaceInput extends AdminLocalizedPlaceFields {
  image: string;
  city: string;
  region: string;
  category: CategoryId;
  durationMinutes: number;
  featured: boolean;
  coordinates: Coordinates;
  autoTranslate?: boolean;
}

export interface TranslationResult {
  name_ru: string;
  name_en: string;
  description_ru: string;
  description_en: string;
}

export interface PlaceFilters {
  city?: string;
  category?: CategoryId;
  featured?: boolean;
}

export interface RoutePlaceSummary {
  id: string;
  name: string;
  city: string;
  category: CategoryId;
  image: string;
}

export interface RouteItem {
  time: string;
  place: RoutePlaceSummary;
  reason: string;
  estimatedDurationMinutes: number;
}

export interface GeneratedRoute {
  city: string;
  duration: RouteDuration;
  language: Language;
  totalMinutes: number;
  items: RouteItem[];
}

export interface RouteGenerationInput {
  city: string;
  duration: RouteDuration;
  interests: CategoryId[];
  language: Language;
}

export interface ChatInput {
  message: string;
  language: Language;
}

export interface ChatResponse {
  reply: string;
  source: "fallback" | "openai";
  suggestions?: string[];
}

export interface ErrorDetail {
  path: string;
  message: string;
}
