import type { Request, Response } from "express";
import { getCategoriesQuerySchema } from "../schemas/categories.schema";
import { getCategories } from "../services/categories.service";
import { resolveRequestLanguage } from "../utils/request-language";

export const listCategories = (request: Request, response: Response): void => {
  const query = getCategoriesQuerySchema.parse(request.query);
  const language = resolveRequestLanguage(request, query.language);
  response.json({ items: getCategories(language) });
};
