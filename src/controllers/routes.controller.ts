import type { Request, Response } from "express";
import { generateRouteBodySchema } from "../schemas/routes.schema";
import { generateRoute } from "../services/route-generator.service";

export const generateRouteController = (request: Request, response: Response): void => {
  const body = generateRouteBodySchema.parse(request.body);
  response.json({ item: generateRoute(body) });
};
