import fs from "node:fs";
import path from "node:path";
import { env } from "../config/env";
import { placesDataSchema } from "../schemas/tourism-data.schema";
import type {
  AdminPlaceInput,
  Coordinates,
  Language,
  Place,
  PlaceFilters,
  PublicPlace,
  RoutePlaceSummary,
  TranslationResult,
} from "../types/tourism.types";
import { calculateDistanceKm } from "../utils/route-helpers";
import { AppError } from "../utils/app-error";
import { localizePlace, normalizeText, resolveCityName } from "../utils/text-helpers";

const placesFilePath = path.join(process.cwd(), "src", "data", "places.json");

class PlacesService {
  private placesCache: Place[] | null = null;

  getPublicPlaces(filters: PlaceFilters = {}): PublicPlace[] {
    return this.getPlaces(filters).map((place) => this.toPublicPlace(place));
  }

  getPublicPlaceById(id: string, language?: Language): PublicPlace | undefined {
    const place = this.getPlaceById(id, language);
    return place ? this.toPublicPlace(place) : undefined;
  }

  getPlaces(filters: PlaceFilters = {}): Place[] {
    const places = this.loadPlaces();
    const resolvedCity = filters.city ? this.resolveCityName(filters.city) : undefined;
    const normalizedCityQuery = filters.city ? normalizeText(filters.city) : undefined;

    return places
      .filter((place) => {
        const matchesCity = !normalizedCityQuery
          || (resolvedCity
            ? normalizeText(place.city) === normalizeText(resolvedCity)
            : normalizeText(place.city).includes(normalizedCityQuery));
        const matchesCategory = !filters.category || place.category === filters.category;
        const matchesFeatured = filters.featured === undefined || place.featured === filters.featured;

        return matchesCity && matchesCategory && matchesFeatured;
      })
      .map((place) => this.toClientPlace(place, filters.language));
  }

  getPlaceById(id: string, language?: Language): Place | undefined {
    const place = this.loadPlaces().find((item) => item.id === id);
    return place ? this.toClientPlace(place, language) : undefined;
  }

  getAllPlaces(language?: Language): Place[] {
    return this.loadPlaces().map((place) => this.toClientPlace(place, language));
  }

  getPlacesByCity(city: string, language?: Language): Place[] {
    return this.getRawPlacesByCity(city).map((place) => this.toClientPlace(place, language));
  }

  getPlacesByRegion(region: string, language?: Language): Place[] {
    const normalizedRegion = normalizeText(region);

    return this.loadPlaces()
      .filter((place) => normalizeText(place.region) === normalizedRegion)
      .map((place) => this.toClientPlace(place, language));
  }

  getNearbyPlaces(city: string, maxDistanceKm: number, language?: Language): Place[] {
    if (maxDistanceKm <= 0) {
      return [];
    }

    const resolvedCity = this.resolveCityName(city);
    const cityCenter = resolvedCity ? this.getCityCenter(resolvedCity) : undefined;

    if (!resolvedCity || !cityCenter) {
      return [];
    }

    return this.loadPlaces()
      .filter((place) => normalizeText(place.city) !== normalizeText(resolvedCity))
      .map((place) => ({
        place,
        distanceKm: calculateDistanceKm(cityCenter, place.coordinates),
      }))
      .filter((candidate) => candidate.distanceKm <= maxDistanceKm)
      .sort((left, right) => {
        if (left.distanceKm !== right.distanceKm) {
          return left.distanceKm - right.distanceKm;
        }

        if (left.place.featured !== right.place.featured) {
          return Number(right.place.featured) - Number(left.place.featured);
        }

        return left.place.name.localeCompare(right.place.name);
      })
      .map((candidate) => this.toClientPlace(candidate.place, language));
  }

  getFeaturedPlaces(limit?: number, language?: Language): Place[] {
    const featuredPlaces = this.loadPlaces()
      .filter((place) => place.featured)
      .map((place) => this.toClientPlace(place, language));

    return limit ? featuredPlaces.slice(0, limit) : featuredPlaces;
  }

  getKnownCities(): string[] {
    return Array.from(new Set(this.loadPlaces().map((place) => place.city))).sort((leftCity, rightCity) =>
      leftCity.localeCompare(rightCity),
    );
  }

  resolveCityName(city: string): string | undefined {
    return resolveCityName(city, this.loadPlaces());
  }

  getCityCenter(city: string): Coordinates | undefined {
    const cityPlaces = this.getRawPlacesByCity(city);

    if (cityPlaces.length === 0) {
      return undefined;
    }

    const totalCoordinates = cityPlaces.reduce(
      (accumulator, place) => ({
        lat: accumulator.lat + place.coordinates.lat,
        lng: accumulator.lng + place.coordinates.lng,
      }),
      { lat: 0, lng: 0 },
    );

    return {
      lat: totalCoordinates.lat / cityPlaces.length,
      lng: totalCoordinates.lng / cityPlaces.length,
    };
  }

  createPlace(input: AdminPlaceInput, translation?: TranslationResult): Place {
    const places = this.loadPlaces();
    const id = this.generateUniqueId(input.name_uz, places);
    const place = this.buildPlaceRecord(id, input, translation);

    this.writePlaces([...places, place]);
    return this.toClientPlace(place);
  }

  updatePlace(id: string, input: AdminPlaceInput, translation?: TranslationResult): Place {
    const places = this.loadPlaces();
    const placeIndex = places.findIndex((place) => place.id === id);

    if (placeIndex === -1) {
      throw new AppError(404, "Place not found");
    }

    const updatedPlace = this.buildPlaceRecord(id, input, translation, places[placeIndex]);
    const updatedPlaces = [...places];
    updatedPlaces[placeIndex] = updatedPlace;

    this.writePlaces(updatedPlaces);
    return this.toClientPlace(updatedPlace);
  }

  deletePlace(id: string): void {
    const places = this.loadPlaces();
    const nextPlaces = places.filter((place) => place.id !== id);

    if (nextPlaces.length === places.length) {
      throw new AppError(404, "Place not found");
    }

    this.writePlaces(nextPlaces);
  }

  private loadPlaces(): Place[] {
    if (this.placesCache) {
      return this.placesCache;
    }

    const rawContent = fs.readFileSync(placesFilePath, "utf8");
    const parsedContent = JSON.parse(rawContent) as unknown;
    this.placesCache = placesDataSchema.parse(parsedContent) as Place[];

    return this.placesCache;
  }

  private writePlaces(places: Place[]): void {
    this.placesCache = places;
    fs.writeFileSync(placesFilePath, `${JSON.stringify(places, null, 2)}\n`, "utf8");
  }

  private getRawPlacesByCity(city: string): Place[] {
    const resolvedCity = this.resolveCityName(city);

    if (!resolvedCity) {
      return [];
    }

    return this.loadPlaces().filter((place) => normalizeText(place.city) === normalizeText(resolvedCity));
  }

  private buildPlaceRecord(
    id: string,
    input: AdminPlaceInput,
    translation?: TranslationResult,
    existingPlace?: Place,
  ): Place {
    const nameUz = input.name_uz.trim();
    const descriptionUz = input.description_uz.trim();

    return {
      id,
      name: nameUz,
      name_kaa: input.name_kaa.trim(),
      name_uz: nameUz,
      name_ru: this.pickLocalizedValue(translation?.name_ru, input.name_ru, existingPlace?.name_ru, nameUz),
      name_en: this.pickLocalizedValue(translation?.name_en, input.name_en, existingPlace?.name_en, nameUz),
      city: input.city.trim(),
      region: input.region.trim(),
      category: input.category,
      durationMinutes: input.durationMinutes,
      description: descriptionUz,
      description_kaa: input.description_kaa.trim(),
      description_uz: descriptionUz,
      description_ru: this.pickLocalizedValue(
        translation?.description_ru,
        input.description_ru,
        existingPlace?.description_ru,
        descriptionUz,
      ),
      description_en: this.pickLocalizedValue(
        translation?.description_en,
        input.description_en,
        existingPlace?.description_en,
        descriptionUz,
      ),
      image: input.image.trim(),
      coordinates: input.coordinates,
      featured: input.featured,
    };
  }

  private toClientPlace(place: Place, language?: Language): Place {
    const localizedPlace = language ? localizePlace(place, language) : place;

    return {
      ...localizedPlace,
      image: this.resolveImageUrl(localizedPlace.image),
    };
  }

  toRoutePlaceSummary(place: Place): RoutePlaceSummary {
    return {
      id: place.id,
      name: place.name,
      city: place.city,
      category: place.category,
      imageUrl: place.image,
      coordinates: place.coordinates,
      description: place.description,
    };
  }

  private toPublicPlace(place: Place): PublicPlace {
    return {
      id: place.id,
      name: place.name,
      description: place.description,
      city: place.city,
      region: place.region,
      category: place.category,
      durationMinutes: place.durationMinutes,
      imageUrl: place.image,
      coordinates: place.coordinates,
      featured: place.featured,
    };
  }

  private resolveImageUrl(image: string): string {
    const trimmedImage = image.trim();
    const publicBaseUrl = env.PUBLIC_BASE_URL
      || (env.NODE_ENV !== "production" ? `http://localhost:${env.PORT}` : undefined);

    if (!trimmedImage) {
      return trimmedImage;
    }

    if (
      /^https?:\/\//i.test(trimmedImage)
      || /^data:/i.test(trimmedImage)
      || /^blob:/i.test(trimmedImage)
      || /^\/\//.test(trimmedImage)
    ) {
      return trimmedImage;
    }

    if (trimmedImage.startsWith("/")) {
      return publicBaseUrl ? `${publicBaseUrl}${trimmedImage}` : trimmedImage;
    }

    if (trimmedImage.startsWith("assets/")) {
      return publicBaseUrl ? `${publicBaseUrl}/${trimmedImage}` : `/${trimmedImage}`;
    }

    if (trimmedImage.startsWith("./assets/")) {
      const normalizedAssetPath = trimmedImage.slice(2);
      return publicBaseUrl ? `${publicBaseUrl}/${normalizedAssetPath}` : `/${normalizedAssetPath}`;
    }

    return trimmedImage;
  }

  private pickLocalizedValue(
    translatedValue?: string,
    manualValue?: string,
    existingValue?: string,
    fallbackValue?: string,
  ): string {
    return translatedValue?.trim()
      || manualValue?.trim()
      || existingValue?.trim()
      || fallbackValue?.trim()
      || "";
  }

  private generateUniqueId(baseName: string, places: Place[]): string {
    const baseSlug = this.slugify(baseName) || `place-${Date.now()}`;
    let candidate = baseSlug;
    let counter = 2;

    while (places.some((place) => place.id === candidate)) {
      candidate = `${baseSlug}-${counter}`;
      counter += 1;
    }

    return candidate;
  }

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
}

export const placesService = new PlacesService();
