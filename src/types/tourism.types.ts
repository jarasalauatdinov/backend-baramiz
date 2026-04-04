import { CATEGORY_IDS, LANGUAGE_CODES, ROUTE_DURATION_MINUTES } from "../constants/tourism.constants";

export type CategoryId = (typeof CATEGORY_IDS)[number];
export type Language = (typeof LANGUAGE_CODES)[number];
export type RouteDuration = keyof typeof ROUTE_DURATION_MINUTES;

export interface LocalizedValue<T> {
  kaa?: T;
  uz?: T;
  ru?: T;
  en: T;
}

export interface MultilingualText {
  kaa: string;
  uz: string;
  ru: string;
  en: string;
}

export type MultilingualTextInput = string | Partial<Record<Language, string>>;

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Category {
  id: string;
  slug: string;
  names: MultilingualText;
  icon?: string;
  type: string;
  sort_order: number;
  is_active: boolean;
}

export interface PublicCategory {
  id: string;
  slug: string;
  name: string;
  names: MultilingualText;
  icon?: string;
  type: string;
  sort_order: number;
  is_active: boolean;
}

export interface Place {
  id: string;
  slug: string;
  city: string;
  region: string;
  category: CategoryId;
  name: string;
  name_kaa: string;
  name_uz: string;
  name_ru: string;
  name_en: string;
  description: string;
  description_kaa: string;
  description_uz: string;
  description_ru: string;
  description_en: string;
  shortDescription: string;
  address?: string;
  coordinates: Coordinates;
  duration: number;
  image: string;
  gallery: string[];
  tags: string[];
  featured: boolean;
  rating?: number;
  workingHours?: string;
  price?: string;
}

export interface PublicPlace {
  id: string;
  slug: string;
  city: string;
  region: string;
  category: CategoryId;
  name: string;
  description: string;
  shortDescription: string;
  address?: string;
  coordinates: Coordinates;
  duration: number;
  image: string;
  gallery: string[];
  tags: string[];
  featured: boolean;
  rating?: number;
  workingHours?: string;
  price?: string;
}

export interface AdminPlaceInput {
  name_kaa: string;
  name_uz: string;
  name_ru?: string;
  name_en?: string;
  description_kaa: string;
  description_uz: string;
  description_ru?: string;
  description_en?: string;
  shortDescription?: string;
  image?: string;
  imageUrl?: string;
  gallery?: string[];
  city: string;
  region: string;
  address?: string;
  category: CategoryId;
  featured: boolean;
  coordinates: Coordinates;
  duration?: number;
  durationMinutes?: number;
  tags?: string[];
  rating?: number;
  workingHours?: string;
  price?: string;
  autoTranslate?: boolean;
}

export type AdminPlaceUpdate = AdminPlaceInput;

export interface TranslationRequest {
  name_uz: string;
  description_uz: string;
}

export interface TranslationResponse {
  name_ru: string;
  name_en: string;
  description_ru: string;
  description_en: string;
}

export interface Guide {
  id: string;
  name: string;
  city: string;
  availableCities: string[];
  languages: string[];
  specialties: string[];
  shortBio: string;
  contactLabel: string;
  contactHref: string;
  contactMethod: "phone" | "telegram" | "email";
  image: string;
}

export type ServiceSectionType = "discovery" | "utility";
export type ServiceMetadataValue = string | number | boolean | string[] | null;
export type ServiceMetadata = Record<string, ServiceMetadataValue>;

export interface ServiceSection {
  id: string;
  slug: string;
  title: MultilingualText;
  shortDescription?: MultilingualText;
  description?: MultilingualText;
  image: string;
  icon?: string;
  order: number;
  isActive: boolean;
  type: ServiceSectionType;
}

export interface ServiceSectionCard {
  id: string;
  slug: string;
  title: string;
  image: string;
  order: number;
  isActive: boolean;
  shortDescription?: string;
  description?: string;
  icon?: string;
  type?: ServiceSectionType;
}
export type PublicServiceSection = ServiceSectionCard;

export interface ServiceItem {
  id: string;
  sectionSlug: string;
  slug: string;
  title: MultilingualText;
  shortDescription?: MultilingualText;
  description?: MultilingualText;
  image?: string;
  gallery: string[];
  address?: string;
  city?: string;
  phoneNumbers: string[];
  workingHours?: string;
  district?: string;
  mapLink?: string;
  instagram?: string;
  telegram?: string;
  website?: string;
  emergencyNote?: string;
  serviceType?: string;
  coordinates?: Coordinates;
  tags: string[];
  featured: boolean;
  isActive: boolean;
  metadata: ServiceMetadata;
}

export type ServiceSectionItem = ServiceItem;

export interface PublicServiceItem {
  id: string;
  sectionSlug: string;
  slug: string;
  title: string;
  shortDescription?: string;
  description?: string;
  image?: string;
  gallery: string[];
  address?: string;
  city?: string;
  phoneNumbers: string[];
  workingHours?: string;
  district?: string;
  mapLink?: string;
  instagram?: string;
  telegram?: string;
  website?: string;
  distanceKm?: number;
  distanceText?: string;
  emergencyNote?: string;
  serviceType?: string;
  coordinates?: Coordinates;
  tags: string[];
  featured: boolean;
  isActive: boolean;
  metadata: ServiceMetadata;
}

export interface AdminServiceSectionInput {
  slug?: string;
  title: MultilingualTextInput;
  shortDescription?: MultilingualTextInput;
  description?: MultilingualTextInput;
  image: string;
  icon?: string;
  order?: number;
  isActive?: boolean;
  type: ServiceSectionType;
}

export interface AdminServiceItemInput {
  sectionSlug?: string;
  slug?: string;
  title: MultilingualTextInput;
  shortDescription?: MultilingualTextInput;
  description?: MultilingualTextInput;
  image?: string;
  gallery?: string[];
  address?: string;
  city?: string;
  phoneNumbers?: string[];
  workingHours?: string;
  district?: string;
  mapLink?: string;
  instagram?: string;
  telegram?: string;
  website?: string;
  emergencyNote?: string;
  serviceType?: string;
  coordinates?: Coordinates;
  tags?: string[];
  featured?: boolean;
  isActive?: boolean;
  metadata?: ServiceMetadata;
}

export interface EventItem {
  id: string;
  slug: string;
  city: string;
  region: string;
  title: string;
  description: string;
  dateLabel: string;
  season: string;
  venue: string;
  category: string;
  image: string;
  featured: boolean;
}

export interface PlaceFilters {
  city?: string;
  category?: CategoryId;
  featured?: boolean;
  language?: Language;
}

export interface RouteStop {
  id: string;
  order: number;
  name: string;
  city: string;
  category: CategoryId;
  description: string;
  estimatedDurationMinutes: number;
  image: string;
}

export interface GeneratedRoute {
  city: string;
  language: Language;
  duration: RouteDuration;
  title: string;
  summary: string;
  totalDurationMinutes: number;
  stops: RouteStop[];
}

export interface RouteGenerationInput {
  city: string;
  duration: RouteDuration;
  interests: CategoryId[];
  language: Language;
}

export interface ChatRequest {
  message: string;
  language: Language;
}

export interface ChatResponse {
  reply: string;
  source: "fallback" | "openai";
  suggestions?: string[];
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface StoredAuthUser extends AuthUser {
  passwordHash: string;
}

export interface AuthSession {
  id: string;
  userId: string;
  token: string;
  createdAt: string;
  expiresAt: string;
}

export interface AuthPayload {
  user: AuthUser;
  token: string;
  expiresAt: string;
}

export interface ErrorDetail {
  path: string;
  message: string;
}
