import type { Request, Response } from "express";
import {
  getPlaceByIdParamsSchema,
  getPlaceByIdQuerySchema,
  getPlacesQuerySchema,
} from "../schemas/places.schema";
import { getPublicPlaceById, getPublicPlaces } from "../services/places.service";
import { AppError } from "../utils/app-error";
import { resolveRequestLanguage } from "../utils/request-language";

export const getPlaces = (request: Request, response: Response): void => {
  const query = getPlacesQuerySchema.parse(request.query);
  const language = resolveRequestLanguage(request, query.language);
  response.json({ items: getPublicPlaces({ ...query, language }) });
};

export const getPlaceById = (request: Request, response: Response): void => {
  const params = getPlaceByIdParamsSchema.parse(request.params);
  const query = getPlaceByIdQuerySchema.parse(request.query);
  const language = resolveRequestLanguage(request, query.language);
  const place = getPublicPlaceById(params.id, language);

  if (!place) {
    throw new AppError(404, "Place not found");
  }

  response.json({ item: place });
};
