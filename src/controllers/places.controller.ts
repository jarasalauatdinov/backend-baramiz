import type { Request, Response } from "express";
import { getPlaceByIdParamsSchema, getPlacesQuerySchema } from "../schemas/places.schema";
import { placesService } from "../services/places.service";
import { AppError } from "../utils/app-error";

export const getPlaces = (request: Request, response: Response): void => {
  const query = getPlacesQuerySchema.parse(request.query);
  response.json(placesService.getPlaces(query));
};

export const getPlaceById = (request: Request, response: Response): void => {
  const params = getPlaceByIdParamsSchema.parse(request.params);
  const place = placesService.getPlaceById(params.id);

  if (!place) {
    throw new AppError(404, "Place not found");
  }

  response.json(place);
};
