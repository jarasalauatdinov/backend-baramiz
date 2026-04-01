import {
  ROUTE_CITY_CLUSTERS,
  ROUTE_DURATION_MINUTES,
  ROUTE_IDEAL_STOP_COUNT,
  ROUTE_NEARBY_FALLBACK_MAX_DISTANCE_KM,
  ROUTE_START_TIME,
} from "../constants/tourism.constants";
import type { CategoryId, GeneratedRoute, Place, RouteGenerationInput } from "../types/tourism.types";
import {
  buildRouteReason,
  createTimeRange,
  estimateTransferMinutes,
  timeToMinutes,
} from "../utils/route-helpers";
import { AppError } from "../utils/app-error";
import { normalizeText } from "../utils/text-helpers";
import { placesService } from "./places.service";

interface RankedCandidate {
  place: Place;
  transferMinutes: number;
  score: number;
  totalCostMinutes: number;
}

class RouteGeneratorService {
  generateRoute(input: RouteGenerationInput): GeneratedRoute {
    const resolvedCity = placesService.resolveCityName(input.city);

    if (!resolvedCity) {
      throw new AppError(404, `No places found for city "${input.city}"`);
    }

    const requestedCityPlaces = placesService.getPlacesByCity(resolvedCity, input.language);

    if (requestedCityPlaces.length === 0) {
      throw new AppError(404, `No places found for city "${resolvedCity}"`);
    }

    const candidatePlaces = this.buildCandidatePlaces(resolvedCity, input, requestedCityPlaces);
    const budgetMinutes = ROUTE_DURATION_MINUTES[input.duration];
    const startOfDayMinutes = timeToMinutes(ROUTE_START_TIME);
    const cityCenter = placesService.getCityCenter(resolvedCity);
    const routeItems: GeneratedRoute["items"] = [];
    const usedCategories = new Set<CategoryId>();

    let currentTimeMinutes = startOfDayMinutes;
    let elapsedMinutes = 0;
    let previousPlace: Place | undefined;

    const remainingCandidates = [...candidatePlaces];

    while (remainingCandidates.length > 0) {
      const rankedCandidates = remainingCandidates
        .map((place) => {
          const transferMinutes = this.getTransferMinutes(previousPlace, place, resolvedCity, cityCenter);
          const visitCostMinutes = place.durationMinutes + transferMinutes;

          return {
            place,
            transferMinutes,
            totalCostMinutes: visitCostMinutes,
            score: this.scoreCandidate({
              place,
              resolvedCity,
              interests: input.interests,
              duration: input.duration,
              remainingMinutes: budgetMinutes - elapsedMinutes,
              usedCategories,
              transferMinutes,
              hasStarted: routeItems.length > 0,
            }),
          } satisfies RankedCandidate;
        })
        .filter((candidate) => {
          if (candidate.totalCostMinutes <= (budgetMinutes - elapsedMinutes)) {
            return true;
          }

          return routeItems.length === 0 && candidate.place.durationMinutes <= budgetMinutes;
        })
        .sort((left, right) => {
          if (left.score !== right.score) {
            return right.score - left.score;
          }

          if (left.transferMinutes !== right.transferMinutes) {
            return left.transferMinutes - right.transferMinutes;
          }

          if (left.place.durationMinutes !== right.place.durationMinutes) {
            return left.place.durationMinutes - right.place.durationMinutes;
          }

          return left.place.name.localeCompare(right.place.name);
        });

      const nextCandidate = rankedCandidates[0];

      if (!nextCandidate) {
        break;
      }

      const visitStartMinutes = currentTimeMinutes + nextCandidate.transferMinutes;
      const visitEndMinutes = visitStartMinutes + nextCandidate.place.durationMinutes;

      routeItems.push({
        time: createTimeRange(visitStartMinutes, visitEndMinutes),
        place: placesService.toRoutePlaceSummary(nextCandidate.place),
        reason: buildRouteReason({
          place: nextCandidate.place,
          interests: input.interests,
          language: input.language,
          requestedCity: resolvedCity,
          transferMinutes: nextCandidate.transferMinutes,
        }),
        estimatedDurationMinutes: nextCandidate.place.durationMinutes,
      });

      currentTimeMinutes = visitEndMinutes;
      elapsedMinutes += nextCandidate.transferMinutes + nextCandidate.place.durationMinutes;
      usedCategories.add(nextCandidate.place.category);
      previousPlace = nextCandidate.place;

      const nextCandidateIndex = remainingCandidates.findIndex((place) => place.id === nextCandidate.place.id);
      remainingCandidates.splice(nextCandidateIndex, 1);
    }

    if (routeItems.length === 0) {
      throw new AppError(404, `Could not generate a route for city "${resolvedCity}"`);
    }

    return {
      city: resolvedCity,
      duration: input.duration,
      language: input.language,
      totalMinutes: elapsedMinutes,
      items: routeItems,
      summary: {
        stopCount: routeItems.length,
        estimatedStartTime: ROUTE_START_TIME,
        estimatedEndTime: createTimeRange(startOfDayMinutes, currentTimeMinutes).split("-")[1] ?? ROUTE_START_TIME,
        usedDuration: input.duration,
        interests: input.interests,
        tripStyle: input.tripStyle,
        transportPreference: input.transportPreference,
        budgetLevel: input.budgetLevel,
        travelPace: input.travelPace,
      },
    };
  }

  private buildCandidatePlaces(
    resolvedCity: string,
    input: RouteGenerationInput,
    requestedCityPlaces: Place[],
  ): Place[] {
    const idealStopCount = ROUTE_IDEAL_STOP_COUNT[input.duration];
    const needsFallback = requestedCityPlaces.length < idealStopCount
      || requestedCityPlaces.filter((place) => input.interests.includes(place.category)).length === 0;
    const allowedNearbyCities = new Set(ROUTE_CITY_CLUSTERS[resolvedCity] ?? []);

    const nearbyFallbackPlaces = needsFallback
      ? placesService
          .getNearbyPlaces(resolvedCity, ROUTE_NEARBY_FALLBACK_MAX_DISTANCE_KM[input.duration], input.language)
          .filter((place) => {
            if (input.duration !== "1_day") {
              return false;
            }

            return allowedNearbyCities.has(place.city);
          })
          .filter((place) => place.featured || input.interests.includes(place.category))
      : [];

    return [...requestedCityPlaces, ...nearbyFallbackPlaces].filter((place, index, sourcePlaces) => {
      return sourcePlaces.findIndex((candidatePlace) => candidatePlace.id === place.id) === index;
    });
  }

  private getTransferMinutes(
    previousPlace: Place | undefined,
    nextPlace: Place,
    resolvedCity: string,
    cityCenter: ReturnType<typeof placesService.getCityCenter>,
  ): number {
    if (previousPlace) {
      return estimateTransferMinutes(
        previousPlace.coordinates,
        nextPlace.coordinates,
        normalizeText(previousPlace.city) === normalizeText(nextPlace.city),
      );
    }

    if (!cityCenter) {
      return 0;
    }

    if (normalizeText(nextPlace.city) === normalizeText(resolvedCity)) {
      return 0;
    }

    return estimateTransferMinutes(cityCenter, nextPlace.coordinates, false);
  }

  private scoreCandidate(input: {
    place: Place;
    resolvedCity: string;
    interests: CategoryId[];
    duration: RouteGenerationInput["duration"];
    remainingMinutes: number;
    usedCategories: Set<CategoryId>;
    transferMinutes: number;
    hasStarted: boolean;
  }): number {
    const { place, resolvedCity, interests, duration, remainingMinutes, usedCategories, transferMinutes, hasStarted } = input;
    const isSameCity = normalizeText(place.city) === normalizeText(resolvedCity);
    const matchesInterest = interests.includes(place.category);
    let score = 0;

    score += isSameCity ? 120 : 20;
    score += matchesInterest ? 55 : 0;
    score += place.featured ? 18 : 0;
    score += usedCategories.has(place.category) ? -8 : 10;

    if (!hasStarted && isSameCity) {
      score += 20;
    }

    if (!isSameCity && duration !== "1_day") {
      score -= 35;
    }

    if (transferMinutes > 90) {
      score -= 45;
    } else if (transferMinutes > 45) {
      score -= 18;
    }

    if (place.durationMinutes > remainingMinutes) {
      score -= 80;
    } else if (remainingMinutes - place.durationMinutes >= 45) {
      score += 10;
    }

    if (duration === "3_hours" && place.durationMinutes > 120) {
      score -= 20;
    }

    if (duration === "half_day" && place.durationMinutes > 150) {
      score -= 10;
    }

    return score;
  }
}

export const routeGeneratorService = new RouteGeneratorService();
