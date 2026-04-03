import type { Request, Response } from "express";
import { getCategoriesQuerySchema } from "../schemas/categories.schema";
import { getCategories } from "../services/categories.service";

export const listCategories = (request: Request, response: Response): void => {
  const query = getCategoriesQuerySchema.parse(request.query);
  response.json({ items: getCategories(query.language) });
};
