import { ROUTE_DURATION_MINUTES, ROUTE_START_TIME, TRANSFER_BUFFER_MINUTES } from "../constants/tourism.constants";
import type { GeneratedRoute, RouteGenerationInput } from "../types/tourism.types";
import { AppError } from "../utils/app-error";
import { buildRouteReason, createTimeRange, rankPlaces, timeToMinutes } from "../utils/route-helpers";
import { placesService } from "./places.service";

class RouteGeneratorService {
  generateRoute(input: RouteGenerationInput): GeneratedRoute {
    const requestedCityPlaces = placesService.getPlacesByCity(input.city);

    if (requestedCityPlaces.length === 0) {
      throw new AppError(404, `No places found for city "${input.city}"`);
    }

    const requestedRegion = requestedCityPlaces[0].region;

    const sameCityInterestMatches = rankPlaces(
      requestedCityPlaces.filter((place) => input.interests.includes(place.category)),
      input.interests,
    );

    const sameCityFeaturedFallback = rankPlaces(
      requestedCityPlaces.filter((place) => place.featured),
      input.interests,
    );

    const sameRegionFeaturedFallback = rankPlaces(
      placesService
        .getPlacesByRegion(requestedRegion)
        .filter(
          (place) =>
            place.featured &&
            place.city.toLowerCase() !== input.city.toLowerCase(),
        ),
      input.interests,
    );

    const candidatePlaces = [...sameCityInterestMatches, ...sameCityFeaturedFallback, ...sameRegionFeaturedFallback]
      .filter((place, index, sourcePlaces) => {
        return sourcePlaces.findIndex((candidatePlace) => candidatePlace.id === place.id) === index;
      });

    const budgetMinutes = ROUTE_DURATION_MINUTES[input.duration];
    const routeItems: GeneratedRoute["items"] = [];
    const startOfDayMinutes = timeToMinutes(ROUTE_START_TIME);
    let currentTimeMinutes = startOfDayMinutes;
    let elapsedMinutes = 0;

    for (const candidatePlace of candidatePlaces) {
      const transferMinutes = routeItems.length > 0 ? TRANSFER_BUFFER_MINUTES : 0;
      const projectedElapsedMinutes = elapsedMinutes + transferMinutes + candidatePlace.durationMinutes;
      const remainingMinutes = budgetMinutes - elapsedMinutes;

      if (projectedElapsedMinutes > budgetMinutes) {
        const hasOtherFirstStopOption = candidatePlaces.some(
          (place) => place.id !== candidatePlace.id && place.durationMinutes <= budgetMinutes,
        );

        if (routeItems.length > 0 || hasOtherFirstStopOption || candidatePlace.durationMinutes > remainingMinutes) {
          continue;
        }
      }

      const visitStartMinutes = currentTimeMinutes + transferMinutes;
      const visitEndMinutes = visitStartMinutes + candidatePlace.durationMinutes;

      routeItems.push({
        time: createTimeRange(visitStartMinutes, visitEndMinutes),
        place: {
          id: candidatePlace.id,
          name: candidatePlace.name,
          city: candidatePlace.city,
          category: candidatePlace.category,
          image: candidatePlace.image,
        },
        reason: buildRouteReason(candidatePlace, input.interests, input.language, input.city),
        estimatedDurationMinutes: candidatePlace.durationMinutes,
      });

      currentTimeMinutes = visitEndMinutes;
      elapsedMinutes = visitEndMinutes - startOfDayMinutes;
    }

    if (routeItems.length === 0) {
      throw new AppError(404, `Could not generate a route for city "${input.city}"`);
    }

    return {
      city: input.city,
      duration: input.duration,
      language: input.language,
      totalMinutes: elapsedMinutes,
      items: routeItems,
    };
  }
}

export const routeGeneratorService = new RouteGeneratorService();
