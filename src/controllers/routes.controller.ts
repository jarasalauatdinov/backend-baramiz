import type { Request, Response } from "express";
import { generateRouteBodySchema } from "../schemas/routes.schema";
import { generateRoute } from "../services/route-generator.service";
import { resolveRequestLanguage } from "../utils/request-language";

export const generateRouteController = (request: Request, response: Response): void => {
  const body = generateRouteBodySchema.parse(request.body);
  const language = resolveRequestLanguage(request, body.language);
  response.json({ item: generateRoute({ ...body, language }) });
};
