import type { Request, Response } from "express";
import { getTourByIdParamsSchema, getTourByIdQuerySchema, getToursQuerySchema } from "../schemas/tours.schema";
import { getTourById, getTours } from "../services/tours.service";
import { AppError } from "../utils/app-error";
import { resolveRequestLanguage } from "../utils/request-language";

export const listTours = (request: Request, response: Response): void => {
  const query = getToursQuerySchema.parse(request.query);
  const language = resolveRequestLanguage(request, query.language);

  response.json({
    items: getTours({
      city: query.city,
      featured: query.featured,
      type: query.type,
      language,
    }),
  });
};

export const getTour = (request: Request, response: Response): void => {
  const params = getTourByIdParamsSchema.parse(request.params);
  const query = getTourByIdQuerySchema.parse(request.query);
  const language = resolveRequestLanguage(request, query.language);
  const item = getTourById(params.id, language);

  if (!item) {
    throw new AppError(404, "Tour not found");
  }

  response.json({ item });
};
