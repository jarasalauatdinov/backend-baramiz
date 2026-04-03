import type { Request, Response } from "express";
import { getGuides } from "../services/guides.service";

export const listGuides = (_request: Request, response: Response): void => {
  response.json({ items: getGuides() });
};
