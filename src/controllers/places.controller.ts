import type { Request, Response } from "express";
import {
  getPlaceByIdParamsSchema,
  getPlaceByIdQuerySchema,
  getPlacesQuerySchema,
} from "../schemas/places.schema";
import { placesService } from "../services/places.service";
import { AppError } from "../utils/app-error";

export const getPlaces = (request: Request, response: Response): void => {
  const query = getPlacesQuerySchema.parse(request.query);
  response.json(placesService.getPublicPlaces(query));
};

export const getPlaceById = (request: Request, response: Response): void => {
  const params = getPlaceByIdParamsSchema.parse(request.params);
  const query = getPlaceByIdQuerySchema.parse(request.query);
  const place = placesService.getPublicPlaceById(params.id, query.language);

  if (!place) {
    throw new AppError(404, "Place not found");
  }

  response.json(place);
};
