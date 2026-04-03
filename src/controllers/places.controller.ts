import type { Request, Response } from "express";
import {
  getPlaceByIdParamsSchema,
  getPlaceByIdQuerySchema,
  getPlacesQuerySchema,
} from "../schemas/places.schema";
import { getPublicPlaceById, getPublicPlaces } from "../services/places.service";
import { AppError } from "../utils/app-error";

export const getPlaces = (request: Request, response: Response): void => {
  const query = getPlacesQuerySchema.parse(request.query);
  response.json({ items: getPublicPlaces(query) });
};

export const getPlaceById = (request: Request, response: Response): void => {
  const params = getPlaceByIdParamsSchema.parse(request.params);
  const query = getPlaceByIdQuerySchema.parse(request.query);
  const place = getPublicPlaceById(params.id, query.language);

  if (!place) {
    throw new AppError(404, "Place not found");
  }

  response.json({ item: place });
};
