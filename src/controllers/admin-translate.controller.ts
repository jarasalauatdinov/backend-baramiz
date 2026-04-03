import type { Request, Response } from "express";
import { adminTranslateBodySchema } from "../schemas/admin-translate.schema";
import { translatePlaceFromUz } from "../services/translation.service";

export const translateAdminPlaceContent = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const body = adminTranslateBodySchema.parse(request.body);
  const translations = await translatePlaceFromUz(
    body.name_uz,
    body.description_uz,
  );

  response.json({ item: translations });
};
