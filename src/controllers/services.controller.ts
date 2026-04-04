import type { Request, Response } from "express";
import { serviceItemsQuerySchema } from "../schemas/service.schema";
import { getServices } from "../services/services.service";
import { resolveRequestLanguage } from "../utils/request-language";

export const listServices = (request: Request, response: Response): void => {
  const query = serviceItemsQuerySchema.parse(request.query);
  const language = resolveRequestLanguage(request, query.language);
  response.json({ items: getServices({ ...query, language }) });
};
