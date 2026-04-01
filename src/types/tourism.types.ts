import { CATEGORY_IDS, LANGUAGE_CODES, ROUTE_DURATION_MINUTES } from "../constants/tourism.constants";

export type CategoryId = (typeof CATEGORY_IDS)[number];
export type Language = (typeof LANGUAGE_CODES)[number];
export type RouteDuration = keyof typeof ROUTE_DURATION_MINUTES;
export type TripStyle = "balanced" | "culture" | "scenic" | "family";
export type TransportPreference = "walking" | "car" | "driver";
export type BudgetLevel = "light" | "comfortable" | "premium";
export type TravelPace = "easy" | "steady" | "full";

export interface LocalizedValue<T> {
  kaa?: T;
  uz?: T;
  ru?: T;
  en: T;
}

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
  language?: Language;
}

export interface PublicPlace {
  id: string;
  name: string;
  description: string;
  city: string;
  region: string;
  category: CategoryId;
  durationMinutes: number;
  imageUrl: string;
  coordinates: Coordinates;
  featured: boolean;
}

export interface RoutePlaceSummary {
  id: string;
  name: string;
  city: string;
  category: CategoryId;
  imageUrl: string;
  coordinates: Coordinates;
  description: string;
}

export interface RouteItem {
  time: string;
  place: RoutePlaceSummary;
  reason: string;
  estimatedDurationMinutes: number;
}

export interface RouteSummary {
  stopCount: number;
  estimatedStartTime: string;
  estimatedEndTime: string;
  usedDuration: RouteDuration;
  interests: CategoryId[];
  tripStyle?: TripStyle;
  transportPreference?: TransportPreference;
  budgetLevel?: BudgetLevel;
  travelPace?: TravelPace;
}

export interface GeneratedRoute {
  city: string;
  duration: RouteDuration;
  language: Language;
  totalMinutes: number;
  items: RouteItem[];
  summary: RouteSummary;
}

export interface RouteGenerationInput {
  city: string;
  duration: RouteDuration;
  interests: CategoryId[];
  language: Language;
  tripStyle?: TripStyle;
  transportPreference?: TransportPreference;
  budgetLevel?: BudgetLevel;
  travelPace?: TravelPace;
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

export interface DestinationMetricDefinition {
  label: LocalizedValue<string>;
  value: LocalizedValue<string>;
}

export interface DestinationNearbyPointDefinition {
  id: string;
  title: LocalizedValue<string>;
  description: LocalizedValue<string>;
  category: string;
  image?: string;
  coordinates: Coordinates;
  estimatedVisitMinutes: number;
  tags: LocalizedValue<string[]>;
}

export interface DestinationSupportCardDefinition {
  title: LocalizedValue<string>;
  description: LocalizedValue<string>;
  meta: LocalizedValue<string>;
  tags: LocalizedValue<string[]>;
}

export interface DestinationSupportDataDefinition {
  stays: DestinationSupportCardDefinition[];
  guides: DestinationSupportCardDefinition[];
  food: DestinationSupportCardDefinition[];
  tours: DestinationSupportCardDefinition[];
}

export interface DestinationDefinition {
  slug: string;
  city: string;
  region: string;
  category: string;
  cities: string[];
  heroCategory: string;
  heroImage: string;
  tags: LocalizedValue<string[]>;
  estimatedVisitMinutes: number;
  bestSeason: LocalizedValue<string>;
  coordinates: Coordinates;
  name: LocalizedValue<string>;
  kicker: LocalizedValue<string>;
  summary: LocalizedValue<string>;
  overview: LocalizedValue<string>;
  longDescription: LocalizedValue<string>;
  bestFor: LocalizedValue<string[]>;
  metrics: DestinationMetricDefinition[];
  nearbyPoints: DestinationNearbyPointDefinition[];
  support: DestinationSupportDataDefinition;
}

export interface DestinationMetric {
  label: string;
  value: string;
}

export interface DestinationNearbyPoint {
  id: string;
  title: string;
  description: string;
  category: string;
  image?: string;
  coordinates: Coordinates;
  estimatedVisitMinutes: number;
  tags: string[];
}

export interface DestinationSupportCard {
  title: string;
  description: string;
  meta: string;
  tags: string[];
}

export interface DestinationSupportData {
  stays: DestinationSupportCard[];
  guides: DestinationSupportCard[];
  food: DestinationSupportCard[];
  tours: DestinationSupportCard[];
}

export interface Destination {
  slug: string;
  city: string;
  region: string;
  category: string;
  cities: string[];
  heroCategory: string;
  heroImage: string;
  tags: string[];
  estimatedVisitMinutes: number;
  bestSeason: string;
  coordinates: Coordinates;
  name: string;
  kicker: string;
  summary: string;
  overview: string;
  longDescription: string;
  bestFor: string[];
  metrics: DestinationMetric[];
  nearbyPoints: DestinationNearbyPoint[];
  support?: DestinationSupportData;
}

export type ServiceSectionId =
  | "agencies"
  | "accommodation"
  | "transport"
  | "food"
  | "experiences"
  | "tickets"
  | "tour_support";

export interface ServiceSectionCopyDefinition {
  title: LocalizedValue<string>;
  description: LocalizedValue<string>;
}

export interface ServiceCatalogEntryDefinition {
  id: string;
  kind: ServiceSectionId;
  title: LocalizedValue<string>;
  description: LocalizedValue<string>;
  meta: LocalizedValue<string>;
  tags: LocalizedValue<string[]>;
  city?: string;
  region?: string;
  availableCities?: string[];
  contactLabel?: LocalizedValue<string>;
  contactHref?: string;
  availability?: LocalizedValue<string>;
  note?: LocalizedValue<string>;
}

export interface ServiceCatalogEntry {
  id: string;
  kind: ServiceSectionId;
  title: string;
  description: string;
  meta: string;
  tags: string[];
  city?: string;
  region?: string;
  availableCities?: string[];
  contactLabel?: string;
  contactHref?: string;
  availability?: string;
  note?: string;
}

export interface ServiceSection {
  id: ServiceSectionId;
  title: string;
  description: string;
  items: ServiceCatalogEntry[];
}

export interface GuideContactDefinition {
  label: LocalizedValue<string>;
  href: string;
  method: "phone" | "telegram" | "email";
}

export interface GuideDefinition {
  id: string;
  name: LocalizedValue<string>;
  city: string;
  availableCities: string[];
  languages: string[];
  specialties: LocalizedValue<string[]>;
  regionExpertise: LocalizedValue<string[]>;
  availability: LocalizedValue<string>;
  shortBio: LocalizedValue<string>;
  contact: GuideContactDefinition;
  image: string;
}

export interface GuideContact {
  label: string;
  href: string;
  method: "phone" | "telegram" | "email";
}

export interface GuideProfile {
  id: string;
  name: string;
  city: string;
  availableCities: string[];
  languages: string[];
  specialties: string[];
  regionExpertise: string[];
  availability: string;
  shortBio: string;
  contact: GuideContact;
  image: string;
}
