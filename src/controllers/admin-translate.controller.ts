import type { Request, Response } from "express";
import { adminTranslateBodySchema } from "../schemas/admin-translate.schema";
import { translationService } from "../services/translation.service";

export const translateAdminPlaceContent = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const body = adminTranslateBodySchema.parse(request.body);
  const translations = await translationService.translatePlaceFromUz(
    body.name_uz,
    body.description_uz,
  );

  response.json(translations);
};
