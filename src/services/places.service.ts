import path from "node:path";
import { placesDataSchema } from "../schemas/tourism-data.schema";
import type {
  AdminPlaceInput,
  CategoryId,
  Coordinates,
  Language,
  Place,
  PlaceFilters,
  PublicPlace,
  RouteStop,
  TranslationResponse,
} from "../types/tourism.types";
import { AppError } from "../utils/app-error";
import { readJsonFile, writeJsonFile } from "../utils/json-storage";
import { calculateDistanceKm } from "../utils/route-helpers";
import {
  createShortDescription,
  getCategoryLabel,
  getConsistentPlaceLanguage,
  getLocalizedPlaceDescription,
  localizePlace,
  normalizeText,
  resolveCityName,
  slugify,
} from "../utils/text-helpers";
import { resolvePublicAssetUrl } from "../utils/url-helpers";

const placesFilePath = path.join(process.cwd(), "src", "data", "places.json");

let placesCache: Place[] | null = null;

const PLACE_CATEGORY_IMAGE_FALLBACKS: Record<CategoryId, string> = {
  history: "/assets/service/sections/history-and-culture.jpg",
  culture: "/assets/service/sections/history-and-culture.jpg",
  museum: "/assets/service/sections/museums-and-exhibitions.webp",
  nature: "/assets/service/sections/nature.png",
  adventure: "/assets/service/sections/sightseeing.jpg",
  food: "/assets/service/sections/restaurants.webp",
};
const UNRELIABLE_IMAGE_HOST_PATTERNS = [
  /^https?:\/\/encrypted-tbn0\.gstatic\.com\//i,
  /^https?:\/\/pbs\.twimg\.com\/media\//i,
];
const isPlaceholderImageUrl = (value: string | undefined): boolean => {
  return Boolean(value && /^https?:\/\/placehold\.co\//i.test(value.trim()));
};
const isUnreliableImageUrl = (value: string | undefined): boolean => {
  return Boolean(value && UNRELIABLE_IMAGE_HOST_PATTERNS.some((pattern) => pattern.test(value.trim())));
};

const normalizeOptionalString = (value: string | undefined | null): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : undefined;
};

const uniqueNonEmptyStrings = (values: Array<string | undefined>): string[] => {
  return Array.from(new Set(values.map((value) => normalizeOptionalString(value)).filter((value): value is string => Boolean(value))));
};
const normalizeGalleryImages = (gallery: Array<string | undefined>, fallbackImage: string): string[] => {
  const normalizedGallery = uniqueNonEmptyStrings(gallery).filter((value) => {
    return !isPlaceholderImageUrl(value) && !isUnreliableImageUrl(value);
  });

  return normalizedGallery.length > 0 ? normalizedGallery : [fallbackImage];
};

const normalizeStoredShortDescription = (value: string | undefined, fallbackDescription: string): string => {
  const trimmedValue = normalizeOptionalString(value);

  if (!trimmedValue || trimmedValue.endsWith("...")) {
    return createShortDescription(fallbackDescription);
  }

  return trimmedValue;
};

const normalizeStoredPlace = (place: Place): Place => {
  const fallbackImage = PLACE_CATEGORY_IMAGE_FALLBACKS[place.category];
  const image = !normalizeOptionalString(place.image)
    || isPlaceholderImageUrl(place.image)
    || isUnreliableImageUrl(place.image)
    ? fallbackImage
    : place.image.trim();
  const gallery = normalizeGalleryImages(place.gallery, image);
  const tags = uniqueNonEmptyStrings(place.tags);
  const fallbackDescription = normalizeOptionalString(place.description_en)
    || normalizeOptionalString(place.description_uz)
    || normalizeOptionalString(place.description)
    || "";

  return {
    ...place,
    slug: place.slug || slugify(place.id || place.name_uz),
    shortDescription: normalizeStoredShortDescription(place.shortDescription, fallbackDescription),
    address: normalizeOptionalString(place.address),
    image,
    gallery,
    tags: tags.length > 0 ? tags : [place.category, place.city, place.region],
    workingHours: normalizeOptionalString(place.workingHours),
    price: normalizeOptionalString(place.price),
  };
};

const loadPlaces = (): Place[] => {
  if (placesCache) {
    return placesCache;
  }

  const rawPlaces = readJsonFile(placesFilePath, placesDataSchema, []);
  placesCache = rawPlaces.map(normalizeStoredPlace);
  return placesCache;
};

const savePlaces = (places: Place[]): Place[] => {
  const normalizedPlaces = places.map(normalizeStoredPlace);
  placesCache = writeJsonFile(placesFilePath, placesDataSchema, normalizedPlaces);
  return placesCache;
};

const toPublicPlace = (place: Place, language: Language = "en"): PublicPlace => ({
  id: place.id,
  slug: place.slug,
  city: place.city,
  region: place.region,
  category: place.category,
  categoryLabel: getCategoryLabel(place.category, language),
  name: place.name,
  description: place.description,
  shortDescription: place.shortDescription,
  excerpt: place.shortDescription,
  subtitle: `${place.city} - ${getCategoryLabel(place.category, language)}`,
  address: place.address,
  coordinates: place.coordinates,
  duration: place.duration,
  image: resolvePublicAssetUrl(place.image),
  gallery: place.gallery.map(resolvePublicAssetUrl),
  tags: place.tags,
  featured: place.featured,
  rating: place.rating,
  workingHours: place.workingHours,
  price: place.price,
});

const localizeStoredPlace = (place: Place, language: Language = "en"): Place => {
  const contentLanguage = getConsistentPlaceLanguage(place, language);
  const localizedPlace = localizePlace(place, contentLanguage);

  return {
    ...localizedPlace,
    shortDescription: createShortDescription(getLocalizedPlaceDescription(place, contentLanguage)),
  };
};

const matchesFilters = (place: Place, filters: PlaceFilters): boolean => {
  if (filters.category && place.category !== filters.category) {
    return false;
  }

  if (filters.featured !== undefined && place.featured !== filters.featured) {
    return false;
  }

  if (filters.city) {
    const resolvedCity = resolveCityName(filters.city, loadPlaces());

    if (resolvedCity) {
      return normalizeText(place.city) === normalizeText(resolvedCity);
    }

    return normalizeText(place.city).includes(normalizeText(filters.city));
  }

  return true;
};

const createPlaceId = (nameUz: string, existingPlaces: Place[]): string => {
  const baseId = slugify(nameUz);
  let nextId = baseId;
  let suffix = 2;

  while (existingPlaces.some((place) => place.id === nextId)) {
    nextId = `${baseId}-${suffix}`;
    suffix += 1;
  }

  return nextId;
};

const pickLocalizedValue = (
  manualValue: string | undefined,
  translatedValue: string | undefined,
  existingValue: string | undefined,
  fallbackValue: string,
): string => {
  return manualValue?.trim()
    || translatedValue?.trim()
    || existingValue?.trim()
    || fallbackValue.trim();
};

const buildPlaceFromInput = (
  input: AdminPlaceInput,
  existingPlace?: Place,
  translations?: TranslationResponse,
): Place => {
  const nameUz = input.name_uz.trim();
  const descriptionUz = input.description_uz.trim();
  const imageSource = input.imageUrl ?? input.image;
  const duration = input.duration ?? input.durationMinutes;
  const gallery = input.gallery?.map((item) => item.trim()).filter(Boolean) ?? [];
  const tags = input.tags?.map((item) => item.trim()).filter(Boolean) ?? [];
  const fallbackId = existingPlace?.id ?? createPlaceId(nameUz, loadPlaces());

  if (!imageSource) {
    throw new AppError(400, "image is required");
  }

  if (duration === undefined) {
    throw new AppError(400, "duration is required");
  }

  const image = imageSource.trim();

  return normalizeStoredPlace({
    id: fallbackId,
    slug: existingPlace?.slug ?? slugify(nameUz),
    city: input.city.trim(),
    region: input.region.trim(),
    category: input.category,
    name: (existingPlace?.name ?? input.name_en?.trim()) || nameUz,
    name_kaa: input.name_kaa.trim(),
    name_uz: nameUz,
    name_ru: pickLocalizedValue(input.name_ru, translations?.name_ru, existingPlace?.name_ru, nameUz),
    name_en: pickLocalizedValue(input.name_en, translations?.name_en, existingPlace?.name_en, nameUz),
    description: (existingPlace?.description ?? input.description_en?.trim()) || descriptionUz,
    description_kaa: input.description_kaa.trim(),
    description_uz: descriptionUz,
    description_ru: pickLocalizedValue(
      input.description_ru,
      translations?.description_ru,
      existingPlace?.description_ru,
      descriptionUz,
    ),
    description_en: pickLocalizedValue(
      input.description_en,
      translations?.description_en,
      existingPlace?.description_en,
      descriptionUz,
    ),
    shortDescription: input.shortDescription?.trim() || existingPlace?.shortDescription || createShortDescription(descriptionUz),
    address: input.address?.trim() || existingPlace?.address,
    coordinates: input.coordinates,
    duration,
    image,
    gallery: gallery.length > 0 ? gallery : existingPlace?.gallery ?? [image],
    tags: tags.length > 0 ? tags : existingPlace?.tags ?? [input.category, input.city.trim(), input.region.trim()],
    featured: input.featured,
    rating: input.rating ?? existingPlace?.rating,
    workingHours: input.workingHours?.trim() || existingPlace?.workingHours,
    price: input.price?.trim() || existingPlace?.price,
  });
};

export const getPublicPlaces = (filters: PlaceFilters = {}): PublicPlace[] => {
  return loadPlaces()
    .filter((place) => matchesFilters(place, filters))
    .map((place) => localizeStoredPlace(place, filters.language))
    .map((place) => toPublicPlace(place, filters.language));
};

export const getPublicPlaceById = (id: string, language: Language = "en"): PublicPlace | undefined => {
  const normalizedId = normalizeText(id);
  const place = loadPlaces().find((item) => item.id === id || normalizeText(item.slug) === normalizedId);
  return place ? toPublicPlace(localizeStoredPlace(place, language), language) : undefined;
};

export const getPlaces = (filters: PlaceFilters = {}): Place[] => {
  return loadPlaces()
    .filter((place) => matchesFilters(place, filters))
    .map((place) => localizeStoredPlace(place, filters.language));
};

export const getPlaceById = (id: string, language: Language = "en"): Place | undefined => {
  const normalizedId = normalizeText(id);
  const place = loadPlaces().find((item) => item.id === id || normalizeText(item.slug) === normalizedId);
  return place ? localizeStoredPlace(place, language) : undefined;
};

export const getAllPlaces = (language: Language = "en"): Place[] => {
  return loadPlaces().map((place) => localizeStoredPlace(place, language));
};

export const getPlacesByCity = (city: string, language: Language = "en"): Place[] => {
  return getPlaces({ city, language });
};

export const getPlacesByRegion = (region: string, language: Language = "en"): Place[] => {
  return getAllPlaces(language).filter((place) => normalizeText(place.region) === normalizeText(region));
};

export const getKnownCities = (): string[] => {
  return Array.from(new Set(loadPlaces().map((place) => place.city))).sort((left, right) => left.localeCompare(right));
};

export const resolveKnownCityName = (city: string): string | undefined => {
  return resolveCityName(city, loadPlaces());
};

export const getCityCenter = (city: string): Coordinates | undefined => {
  const cityPlaces = getPlacesByCity(city);

  if (cityPlaces.length === 0) {
    return undefined;
  }

  const totals = cityPlaces.reduce((accumulator, place) => ({
    lat: accumulator.lat + place.coordinates.lat,
    lng: accumulator.lng + place.coordinates.lng,
  }), { lat: 0, lng: 0 });

  return {
    lat: totals.lat / cityPlaces.length,
    lng: totals.lng / cityPlaces.length,
  };
};

export const getNearbyPlaces = (city: string, maxDistanceKm: number, language: Language = "en"): Place[] => {
  if (maxDistanceKm <= 0) {
    return [];
  }

  const resolvedCity = resolveKnownCityName(city);
  const cityCenter = resolvedCity ? getCityCenter(resolvedCity) : undefined;

  if (!resolvedCity || !cityCenter) {
    return [];
  }

  return getAllPlaces(language)
    .filter((place) => normalizeText(place.city) !== normalizeText(resolvedCity))
    .map((place) => ({
      place,
      distanceKm: calculateDistanceKm(cityCenter, place.coordinates),
    }))
    .filter((candidate) => candidate.distanceKm <= maxDistanceKm)
    .sort((left, right) => left.distanceKm - right.distanceKm || left.place.name.localeCompare(right.place.name))
    .map((candidate) => candidate.place);
};

export const getFeaturedPlaces = (limit?: number, language: Language = "en"): Place[] => {
  const featuredPlaces = getAllPlaces(language).filter((place) => place.featured);
  return typeof limit === "number" ? featuredPlaces.slice(0, limit) : featuredPlaces;
};

export const createPlace = (input: AdminPlaceInput, translations?: TranslationResponse): Place => {
  const nextPlace = buildPlaceFromInput(input, undefined, translations);
  const updatedPlaces = savePlaces([...loadPlaces(), nextPlace]);
  return localizeStoredPlace(updatedPlaces.find((place) => place.id === nextPlace.id) ?? nextPlace, "en");
};

export const updatePlace = (id: string, input: AdminPlaceInput, translations?: TranslationResponse): Place => {
  const places = loadPlaces();
  const index = places.findIndex((place) => place.id === id);

  if (index === -1) {
    throw new AppError(404, "Place not found");
  }

  const nextPlace = buildPlaceFromInput(input, places[index], translations);
  const nextPlaces = [...places];
  nextPlaces[index] = nextPlace;
  savePlaces(nextPlaces);

  return localizeStoredPlace(nextPlace, "en");
};

export const deletePlace = (id: string): void => {
  const places = loadPlaces();
  const nextPlaces = places.filter((place) => place.id !== id);

  if (nextPlaces.length === places.length) {
    throw new AppError(404, "Place not found");
  }

  savePlaces(nextPlaces);
};

export const toRouteStop = (place: Place, order: number): RouteStop => {
  return {
    id: place.id,
    order,
    name: place.name,
    city: place.city,
    category: place.category,
    description: place.shortDescription,
    estimatedDurationMinutes: place.duration,
    image: resolvePublicAssetUrl(place.image),
  };
};
