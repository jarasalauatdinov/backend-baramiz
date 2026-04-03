import type { Request, Response } from "express";
import { adminPlaceBodySchema, adminPlaceParamsSchema, adminPlacesQuerySchema } from "../schemas/admin-places.schema";
import { createPlace, deletePlace, getPlaceById, getPlaces, updatePlace } from "../services/places.service";
import { translatePlaceFromUz } from "../services/translation.service";
import { AppError } from "../utils/app-error";

const resolveTranslations = async (
  autoTranslate: boolean,
  nameUz: string,
  descriptionUz: string,
) => {
  if (!autoTranslate) {
    return undefined;
  }

  return translatePlaceFromUz(nameUz, descriptionUz);
};

export const getAdminPlaces = (request: Request, response: Response): void => {
  const query = adminPlacesQuerySchema.parse(request.query);
  response.json({ items: getPlaces(query) });
};

export const getAdminPlaceById = (request: Request, response: Response): void => {
  const params = adminPlaceParamsSchema.parse(request.params);
  const place = getPlaceById(params.id);

  if (!place) {
    throw new AppError(404, "Place not found");
  }

  response.json({ item: place });
};

export const createAdminPlace = async (request: Request, response: Response): Promise<void> => {
  const body = adminPlaceBodySchema.parse(request.body);
  const translations = await resolveTranslations(body.autoTranslate ?? false, body.name_uz, body.description_uz);
  const place = createPlace(body, translations);

  response.status(201).json({ item: place });
};

export const updateAdminPlace = async (request: Request, response: Response): Promise<void> => {
  const params = adminPlaceParamsSchema.parse(request.params);
  const body = adminPlaceBodySchema.parse(request.body);
  const translations = await resolveTranslations(body.autoTranslate ?? false, body.name_uz, body.description_uz);
  const place = updatePlace(params.id, body, translations);

  response.json({ item: place });
};

export const deleteAdminPlace = (request: Request, response: Response): void => {
  const params = adminPlaceParamsSchema.parse(request.params);
  deletePlace(params.id);

  response.json({
    message: "Place deleted",
  });
};
