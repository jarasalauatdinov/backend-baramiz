import type { Request, Response } from "express";
import { categoriesService } from "../services/categories.service";

export const getCategories = (_request: Request, response: Response): void => {
  response.json(categoriesService.getCategories());
};
