import fs from "node:fs";
import path from "node:path";
import { env } from "../config/env";
import type { AdminPlaceInput, Place, PlaceFilters, TranslationResult } from "../types/tourism.types";
import { AppError } from "../utils/app-error";

const placesFilePath = path.join(process.cwd(), "src", "data", "places.json");

class PlacesService {
  private placesCache: Place[] | null = null;

  getPlaces(filters: PlaceFilters = {}): Place[] {
    return this.loadPlaces().map((place) => this.toPublicPlace(place)).filter((place) => {
      const matchesCity = !filters.city || place.city.toLowerCase() === filters.city.toLowerCase();
      const matchesCategory = !filters.category || place.category.toLowerCase() === filters.category.toLowerCase();
      const matchesFeatured =
        filters.featured === undefined ? true : place.featured === filters.featured;

      return matchesCity && matchesCategory && matchesFeatured;
    });
  }

  getPlaceById(id: string): Place | undefined {
    const place = this.loadPlaces().find((item) => item.id === id);
    return place ? this.toPublicPlace(place) : undefined;
  }

  getAllPlaces(): Place[] {
    return this.loadPlaces().map((place) => this.toPublicPlace(place));
  }

  getPlacesByCity(city: string): Place[] {
    return this.getPlaces({ city });
  }

  getPlacesByRegion(region: string): Place[] {
    return this.loadPlaces()
      .filter((place) => place.region.toLowerCase() === region.toLowerCase())
      .map((place) => this.toPublicPlace(place));
  }

  getFeaturedPlaces(limit?: number): Place[] {
    const featuredPlaces = this.loadPlaces()
      .filter((place) => place.featured)
      .map((place) => this.toPublicPlace(place));
    return limit ? featuredPlaces.slice(0, limit) : featuredPlaces;
  }

  getKnownCities(): string[] {
    return Array.from(new Set(this.loadPlaces().map((place) => place.city))).sort((leftCity, rightCity) =>
      leftCity.localeCompare(rightCity),
    );
  }

  createPlace(input: AdminPlaceInput, translation?: TranslationResult): Place {
    const places = this.loadPlaces();
    const id = this.generateUniqueId(input.name_uz, places);
    const place = this.buildPlaceRecord(id, input, translation);

    this.writePlaces([...places, place]);
    return this.toPublicPlace(place);
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
    return this.toPublicPlace(updatedPlace);
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
    this.placesCache = JSON.parse(rawContent) as Place[];
    return this.placesCache;
  }

  private writePlaces(places: Place[]): void {
    this.placesCache = places;
    fs.writeFileSync(placesFilePath, `${JSON.stringify(places, null, 2)}\n`, "utf8");
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

  private toPublicPlace(place: Place): Place {
    return {
      ...place,
      image: this.resolveImageUrl(place.image),
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
