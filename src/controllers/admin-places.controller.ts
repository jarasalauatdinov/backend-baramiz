import type { Request, Response } from "express";
import { adminPlaceBodySchema, adminPlaceParamsSchema, adminPlacesQuerySchema } from "../schemas/admin-places.schema";
import { placesService } from "../services/places.service";
import { translationService } from "../services/translation.service";
import { AppError } from "../utils/app-error";

const resolveTranslations = async (
  autoTranslate: boolean,
  nameUz: string,
  descriptionUz: string,
) => {
  if (!autoTranslate) {
    return undefined;
  }

  return translationService.translatePlaceFromUz(nameUz, descriptionUz);
};

export const getAdminPlaces = (request: Request, response: Response): void => {
  const query = adminPlacesQuerySchema.parse(request.query);
  response.json(placesService.getPlaces(query));
};

export const getAdminPlaceById = (request: Request, response: Response): void => {
  const params = adminPlaceParamsSchema.parse(request.params);
  const place = placesService.getPlaceById(params.id);

  if (!place) {
    throw new AppError(404, "Place not found");
  }

  response.json(place);
};

export const createAdminPlace = async (request: Request, response: Response): Promise<void> => {
  const body = adminPlaceBodySchema.parse(request.body);
  const translations = await resolveTranslations(body.autoTranslate ?? false, body.name_uz, body.description_uz);
  const place = placesService.createPlace(body, translations);

  response.status(201).json(place);
};

export const updateAdminPlace = async (request: Request, response: Response): Promise<void> => {
  const params = adminPlaceParamsSchema.parse(request.params);
  const body = adminPlaceBodySchema.parse(request.body);
  const translations = await resolveTranslations(body.autoTranslate ?? false, body.name_uz, body.description_uz);
  const place = placesService.updatePlace(params.id, body, translations);

  response.json(place);
};

export const deleteAdminPlace = (request: Request, response: Response): void => {
  const params = adminPlaceParamsSchema.parse(request.params);
  placesService.deletePlace(params.id);

  response.json({
    message: "Place deleted",
    id: params.id,
  });
};
