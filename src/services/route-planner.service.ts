import {
  ROUTE_CITY_CLUSTERS,
  ROUTE_DURATION_MINUTES,
  ROUTE_IDEAL_STOP_COUNT,
  ROUTE_NEARBY_FALLBACK_MAX_DISTANCE_KM,
} from "../constants/tourism.constants";
import type { CategoryId, Place, RouteDuration, RouteGenerationInput } from "../types/tourism.types";
import { estimateTransferMinutes } from "../utils/route-helpers";
import { AppError } from "../utils/app-error";
import { normalizeText } from "../utils/text-helpers";
import {
  getCityCenter,
  getNearbyPlaces,
  getPlacesByCity,
  resolveKnownCityName,
} from "./places.service";

export interface PlannedRouteStop {
  place: Place;
  transferMinutes: number;
}

export interface PlannedRoute {
  resolvedCity: string;
  duration: RouteDuration;
  language: RouteGenerationInput["language"];
  interests: CategoryId[];
  totalDurationMinutes: number;
  stops: PlannedRouteStop[];
}

interface RankedCandidate {
  place: Place;
  transferMinutes: number;
  totalCostMinutes: number;
  score: number;
}

const getTransferMinutes = (
  previousPlace: Place | undefined,
  nextPlace: Place,
  requestedCity: string,
): number => {
  if (previousPlace) {
    return estimateTransferMinutes(
      previousPlace.coordinates,
      nextPlace.coordinates,
      normalizeText(previousPlace.city) === normalizeText(nextPlace.city),
    );
  }

  const cityCenter = getCityCenter(requestedCity);

  if (!cityCenter || normalizeText(nextPlace.city) === normalizeText(requestedCity)) {
    return 0;
  }

  return estimateTransferMinutes(cityCenter, nextPlace.coordinates, false);
};

const scoreCandidate = (input: {
  place: Place;
  resolvedCity: string;
  interests: CategoryId[];
  duration: RouteDuration;
  remainingMinutes: number;
  usedCategories: Set<CategoryId>;
  transferMinutes: number;
  hasStarted: boolean;
}): number => {
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

  if (place.duration > remainingMinutes) {
    score -= 80;
  } else if (remainingMinutes - place.duration >= 45) {
    score += 10;
  }

  if (duration === "3_hours" && place.duration > 120) {
    score -= 20;
  }

  if (duration === "half_day" && place.duration > 150) {
    score -= 10;
  }

  return score;
};

const buildCandidatePlaces = (
  resolvedCity: string,
  input: RouteGenerationInput,
  requestedCityPlaces: Place[],
): Place[] => {
  const idealStopCount = ROUTE_IDEAL_STOP_COUNT[input.duration];
  const needsFallback = requestedCityPlaces.length < idealStopCount
    || requestedCityPlaces.filter((place) => input.interests.includes(place.category)).length === 0;
  const allowedNearbyCities = new Set(ROUTE_CITY_CLUSTERS[resolvedCity] ?? []);

  const nearbyFallbackPlaces = needsFallback
    ? getNearbyPlaces(resolvedCity, ROUTE_NEARBY_FALLBACK_MAX_DISTANCE_KM[input.duration], input.language)
        .filter((place) => input.duration === "1_day" && allowedNearbyCities.has(place.city))
        .filter((place) => place.featured || input.interests.includes(place.category))
    : [];

  return [...requestedCityPlaces, ...nearbyFallbackPlaces].filter((place, index, sourcePlaces) => {
    return sourcePlaces.findIndex((candidate) => candidate.id === place.id) === index;
  });
};

const resolveRequestedInterests = (candidatePlaces: Place[], requestedInterests: CategoryId[]): CategoryId[] => {
  if (requestedInterests.length > 0) {
    return requestedInterests;
  }

  const rankedCategories = [...candidatePlaces]
    .sort((left, right) => Number(right.featured) - Number(left.featured) || left.duration - right.duration)
    .map((place) => place.category)
    .filter((category, index, sourceCategories) => sourceCategories.indexOf(category) === index);

  return rankedCategories.slice(0, 2);
};

export const planRoute = (input: RouteGenerationInput): PlannedRoute => {
  const resolvedCity = resolveKnownCityName(input.city);

  if (!resolvedCity) {
    throw new AppError(404, `No places found for city "${input.city}"`);
  }

  const requestedCityPlaces = getPlacesByCity(resolvedCity, input.language);

  if (requestedCityPlaces.length === 0) {
    throw new AppError(404, `No places found for city "${resolvedCity}"`);
  }

  const candidatePlaces = buildCandidatePlaces(resolvedCity, input, requestedCityPlaces);
  const interests = resolveRequestedInterests(candidatePlaces, input.interests);
  const totalBudgetMinutes = ROUTE_DURATION_MINUTES[input.duration];
  const usedCategories = new Set<CategoryId>();
  const plannedStops: PlannedRouteStop[] = [];
  const remainingCandidates = [...candidatePlaces];

  let elapsedMinutes = 0;
  let previousPlace: Place | undefined;

  while (remainingCandidates.length > 0) {
    const rankedCandidates = remainingCandidates
      .map((place) => {
        const transferMinutes = getTransferMinutes(previousPlace, place, resolvedCity);
        const totalCostMinutes = transferMinutes + place.duration;

        return {
          place,
          transferMinutes,
          totalCostMinutes,
          score: scoreCandidate({
            place,
            resolvedCity,
            interests,
            duration: input.duration,
            remainingMinutes: totalBudgetMinutes - elapsedMinutes,
            usedCategories,
            transferMinutes,
            hasStarted: plannedStops.length > 0,
          }),
        } satisfies RankedCandidate;
      })
      .filter((candidate) => {
        if (candidate.totalCostMinutes <= (totalBudgetMinutes - elapsedMinutes)) {
          return true;
        }

        return plannedStops.length === 0 && candidate.place.duration <= totalBudgetMinutes;
      })
      .sort((left, right) => {
        if (left.score !== right.score) {
          return right.score - left.score;
        }

        if (left.transferMinutes !== right.transferMinutes) {
          return left.transferMinutes - right.transferMinutes;
        }

        if (left.place.duration !== right.place.duration) {
          return left.place.duration - right.place.duration;
        }

        return left.place.name.localeCompare(right.place.name);
      });

    const nextCandidate = rankedCandidates[0];

    if (!nextCandidate) {
      break;
    }

    plannedStops.push({
      place: nextCandidate.place,
      transferMinutes: nextCandidate.transferMinutes,
    });

    elapsedMinutes += nextCandidate.totalCostMinutes;
    usedCategories.add(nextCandidate.place.category);
    previousPlace = nextCandidate.place;

    const nextIndex = remainingCandidates.findIndex((place) => place.id === nextCandidate.place.id);
    remainingCandidates.splice(nextIndex, 1);
  }

  if (plannedStops.length === 0) {
    throw new AppError(404, `Could not generate a route for city "${resolvedCity}"`);
  }

  return {
    resolvedCity,
    duration: input.duration,
    language: input.language,
    interests,
    totalDurationMinutes: elapsedMinutes,
    stops: plannedStops,
  };
};
