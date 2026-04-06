import path from "node:path";
import { toursDataSchema } from "../schemas/tourism-data.schema";
import type { Language, PublicPlace, TourProduct, TourRecord, TourStopPreview } from "../types/tourism.types";
import { readJsonFile } from "../utils/json-storage";
import { localize, localizeMultilingualText, normalizeText, slugify } from "../utils/text-helpers";
import { resolvePublicAssetUrl } from "../utils/url-helpers";
import { getPublicPlaceById } from "./places.service";

interface TourFilters {
  city?: string;
  featured?: boolean;
  type?: string;
  language?: Language;
}

const toursFilePath = path.join(process.cwd(), "src", "data", "tours.json");

let toursCache: TourRecord[] | null = null;

const titleCase = (value: string): string => {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const toTourStopPreview = (place: PublicPlace): TourStopPreview => ({
  id: place.id,
  slug: place.slug,
  name: place.name,
  city: place.city,
  category: place.category,
  image: place.image,
});

const normalizeTourRecord = (tour: TourRecord): TourRecord => ({
  ...tour,
  slug: slugify(tour.slug || tour.id),
  city: tour.city.trim(),
  type: tour.type.trim(),
  image: tour.image.trim(),
  placeIds: Array.from(new Set(tour.placeIds.map((placeId) => placeId.trim()).filter(Boolean))),
  includedItems: {
    kaa: tour.includedItems.kaa,
    uz: tour.includedItems.uz,
    ru: tour.includedItems.ru,
    en: tour.includedItems.en,
  },
});

const loadTours = (): TourRecord[] => {
  if (toursCache) {
    return toursCache;
  }

  toursCache = readJsonFile(toursFilePath, toursDataSchema, []).map(normalizeTourRecord);
  return toursCache;
};

const resolveTourStops = (tour: TourRecord, language: Language): TourStopPreview[] => {
  return tour.placeIds
    .map((placeId) => getPublicPlaceById(placeId, language))
    .filter((place): place is PublicPlace => Boolean(place))
    .map(toTourStopPreview);
};

const toPublicTour = (tour: TourRecord, language: Language): TourProduct => {
  const stops = resolveTourStops(tour, language);
  const image = resolvePublicAssetUrl(tour.image);
  const gallery = Array.from(new Set([image, ...stops.map((stop) => stop.image)]));
  const categoryLabel = titleCase(tour.type);
  const durationLabel = localizeMultilingualText(tour.durationLabel, language) ?? tour.durationLabel.en;

  return {
    id: tour.id,
    slug: tour.slug,
    city: tour.city,
    title: localizeMultilingualText(tour.title, language) ?? tour.title.en,
    shortDescription: localizeMultilingualText(tour.shortDescription, language) ?? tour.shortDescription.en,
    excerpt: localizeMultilingualText(tour.shortDescription, language) ?? tour.shortDescription.en,
    subtitle: `${tour.city} - ${durationLabel}`,
    image,
    gallery,
    durationLabel,
    type: tour.type,
    categoryLabel,
    priceLabel: tour.priceLabel ? localize(language, tour.priceLabel) : undefined,
    featured: tour.featured,
    bookingReady: tour.bookingReady,
    includedItems: localize(language, tour.includedItems),
    placeIds: tour.placeIds,
    stops,
  };
};

const matchesTourFilters = (tour: TourRecord, filters: TourFilters): boolean => {
  if (filters.featured !== undefined && tour.featured !== filters.featured) {
    return false;
  }

  if (filters.city && normalizeText(tour.city) !== normalizeText(filters.city)) {
    return false;
  }

  if (filters.type && normalizeText(tour.type) !== normalizeText(filters.type)) {
    return false;
  }

  return true;
};

export const getTours = (filters: TourFilters = {}): TourProduct[] => {
  const language = filters.language ?? "en";

  return loadTours()
    .filter((tour) => matchesTourFilters(tour, filters))
    .map((tour) => toPublicTour(tour, language));
};

export const getFeaturedTours = (language: Language = "en", limit?: number): TourProduct[] => {
  const featuredTours = getTours({ featured: true, language });
  return typeof limit === "number" ? featuredTours.slice(0, limit) : featuredTours;
};

export const getTourById = (id: string, language: Language = "en"): TourProduct | undefined => {
  const normalizedId = normalizeText(id);
  const tour = loadTours().find((item) => item.id === id || normalizeText(item.slug) === normalizedId);
  return tour ? toPublicTour(tour, language) : undefined;
};
